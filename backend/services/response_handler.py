import re
from typing import Dict, Any, Tuple, Optional
from .model_manager import ModelManager
from .mock_response_builder import MockResponseBuilder


class ResponseHandler:
    """Handles response generation and parsing"""

    def __init__(self, model_manager: ModelManager, mock_builder: MockResponseBuilder, prompt_builder):
        self.model_manager = model_manager
        self.mock_builder = mock_builder
        self.prompt_builder = prompt_builder

    def generate_response(self, user_query: str, data_context: Dict[str, Any], intent: str = '', rag_context: str = None) -> Dict[str, Any]:
        """Generate a response using the local LLM, returning both thinking and final answer"""
        try:
            # Try MLX-LM integration first
            try:
                # Use PromptBuilder with intent and RAG context for focused response
                prompt = self.prompt_builder.build_crime_analysis_prompt(user_query, data_context, rag_context)
                if intent:
                    prompt += f"\n\nQUERY INTENT: {intent}\nFocus your analysis on this intent while using the data context."
                
                full_response = self.model_manager.generate_response(prompt)
                print(f"MLX-LM full response: {repr(full_response)}")
                print(f"MLX-LM response length: {len(full_response)}")

                # Validate response completeness
                if not full_response or len(full_response.strip()) < 10:
                    raise ValueError("Generated response is too short or empty")

                print("USING REAL MODEL RESPONSE")
            except Exception as gen_error:
                print(f"MLX-LM generation failed: {str(gen_error)}")
                raise gen_error

            # Parse thinking and final answer
            thinking, final_answer = self._parse_reasoning_response(full_response)
            print(f"Parsed thinking: {repr(thinking)}")
            print(f"Parsed final answer: {repr(final_answer)}")

            return {
                'thinking': thinking,
                'response': final_answer
            }

        except Exception as e:
            print(f"MLX-LM failed, using mock response: {str(e)}")
            # Fallback to mock response
            response = self.mock_builder.generate_mock_response(user_query, data_context, intent)
            print(f"Generated mock response: {response[:200]}...")
            print("USING MOCK RESPONSE")
            return {
                'thinking': None,  # Mock responses don't have thinking
                'response': response
            }


    def _parse_reasoning_response(self, full_response: str) -> Tuple[Optional[str], str]:
        """Parse thinking and final answer from reasoning model response"""
        import re

        # Try multiple thinking tag formats
        thinking_patterns = [
            r'<thinking>(.*?)</thinking>',
            r'<think>(.*?)</think>',
            r'<reasoning>(.*?)</reasoning>',
            r'Thinking:(.*?)(?:\n\n|\n[A-Z]|$)',
            r'Reasoning:(.*?)(?:\n\n|\n[A-Z]|$)',
        ]

        # Clean leading/trailing whitespace first
        full_response = full_response.strip()

        for pattern in thinking_patterns:
            thinking_match = re.search(pattern, full_response, re.DOTALL | re.IGNORECASE)
            if thinking_match:
                thinking = thinking_match.group(1).strip()
                # Remove the thinking section from the final answer
                final_answer = re.sub(pattern, '', full_response, flags=re.DOTALL | re.IGNORECASE).strip()
                return thinking, final_answer

        # Check for bullet point outline followed by "Okay," or similar transition
        # This is the pattern the Qwen model uses
        outline_pattern = r'^(\n?- .*\n?(?:\n?- .*\n?)*)\n\n(Okay,?.*)$'
        match = re.search(outline_pattern, full_response, re.MULTILINE)
        if match:
            thinking = match.group(1).strip()
            final_answer = match.group(2).strip() + full_response[match.end():].strip()
            return thinking, final_answer

        # If no thinking tags found, check if response starts with thinking-like content
        lines = full_response.split('\n')
        if lines and any(keyword in lines[0].lower() for keyword in ['think', 'reason', 'analyze', 'consider']):
            # Assume first paragraph is thinking
            thinking_end = full_response.find('\n\n')
            if thinking_end > 0:
                thinking = full_response[:thinking_end].strip()
                final_answer = full_response[thinking_end:].strip()
                return thinking, final_answer

        # No thinking found
        return None, full_response.strip()