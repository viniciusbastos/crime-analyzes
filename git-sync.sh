#!/bin/bash
# git-sync.sh: stage, generate commit message, commit, push.

set -e

if [[ -z $(git status -s) ]]; then
  echo "No changes to commit."
  exit 0
fi

git add .

DIFF=$(git diff --cached)
STAT=$(git diff --cached --shortstat)
FILES=$(git diff --cached --name-only)

# ── LLM commit message (requires NVIDIA_API_KEY) ─────────────────────────────
gen_llm_msg() {
  [[ -z "$NVIDIA_API_KEY" ]] && return 1

  DIFF_TRUNC=$(echo "$DIFF" | head -200)
  MODEL="${NVIDIA_MODEL:-meta/llama-4-maverick-17b-128e-instruct}"

  PROMPT="Generate a git commit message for the following diff.
Rules:
- First line: conventional commit format: type(scope): short description (≤72 chars)
- Types: feat, fix, refactor, test, ci, docs, chore
- Scope: infer from changed files (e.g. api, frontend, db, ci)
- Second block (optional): 1-3 bullet points explaining WHY, not WHAT
- No markdown fences, no preamble

Diff stats: $STAT

Diff:
$DIFF_TRUNC"

  PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
  'model': sys.argv[1],
  'messages': [{'role': 'user', 'content': sys.argv[2]}],
  'temperature': 0.2,
  'max_tokens': 200
}))
" "$MODEL" "$PROMPT")

  RESPONSE=$(curl -s \
    -H "Authorization: Bearer $NVIDIA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "https://integrate.api.nvidia.com/v1/chat/completions" 2>/dev/null)

  MSG=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data['choices'][0]['message']['content'].strip())
" 2>/dev/null)

  [[ -n "$MSG" ]] && echo "$MSG" && return 0
  return 1
}

# ── Fallback: smart conventional commit ───────────────────────────────────────
gen_local_msg() {
  TYPE="chore"
  SCOPES=()

  echo "$FILES" | grep -qE '^tests/|\.test\.|_test\.' && TYPE="test"
  echo "$FILES" | grep -q '\.github/'                 && TYPE="ci"
  echo "$FILES" | grep -qE '\.(md|txt|rst)$'          && TYPE="docs"
  echo "$FILES" | grep -qE '^backend/'  && { TYPE="feat"; SCOPES+=("backend"); }
  echo "$FILES" | grep -qE '^frontend/' && { TYPE="feat"; SCOPES+=("frontend"); }
  echo "$FILES" | grep -qE 'docker|Dockerfile|compose' && TYPE="chore"
  

  SCOPE=$(IFS=,; echo "${SCOPES[*]}")
  COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
  TOP=$(echo "$FILES" | head -3 | xargs -I{} basename {} | paste -sd ', ')
  [[ $COUNT -gt 3 ]] && TOP="$TOP (+$((COUNT-3)) more)"

  SUBJECT="${TYPE}${SCOPE:+(${SCOPE})}: ${TOP}"
  printf "%s\n\n%s" "$SUBJECT" "$STAT"
}

# ── Pick best available message ───────────────────────────────────────────────
echo "Generating commit message..."
if COMMIT_MSG=$(gen_llm_msg); then
  echo "  → LLM message"
else
  COMMIT_MSG=$(gen_local_msg)
  echo "  → local inference"
fi

echo ""
echo "Commit: $(echo "$COMMIT_MSG" | head -1)"
echo ""

git commit -m "$COMMIT_MSG"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$CURRENT_BRANCH"
