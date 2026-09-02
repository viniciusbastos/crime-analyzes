# Sugestões de Melhoria do Sistema

Levantamento feito em 2026-09-02, após a readequação do pipeline de ingestão para o formato do `dados.csv`. Itens ordenados por impacto dentro de cada grupo.

## 1. Dados e ingestão

### 1.1 Chave de deduplicação fraca
`CrimeDataService.load_data_to_database` identifica duplicatas por `(crime_type, date_time, address)`. Dois homicídios na mesma rua, na mesma hora, colapsam em um único registro. O número do BO é a chave natural do dado, mas hoje fica embutido como texto dentro de `description`.

**Ação:** adicionar coluna `bo` (String, unique index) em `crimes` e deduplicar por ela, mantendo a chave atual apenas como fallback quando o BO estiver ausente.

### 1.2 Campos consultáveis empacotados em `description`
`BO`, `Delegacia`, `Sexo` e `Idade` são concatenados em uma string (`"BO: ...; Delegacia: ...; Sexo: ...; Idade: ..."`). Isso impede filtros e análises como "vítimas do sexo feminino entre 18 e 25 anos" sem parsing de texto.

**Ação:** promover a colunas próprias: `bo`, `delegacia`, `sexo`, `idade`, `coorpin`, `regiao`, `id_municipio`. Criar migration e backfill dos registros existentes via regex sobre `description`.

### 1.3 `aisp` como Integer descarta 71% do dataset
No `dados.csv`, a coluna `AISP 2026` é mista: capital/RMS traz `"26 - Candeias"` (numérico), interior traz apenas o nome da região (`"Portal do Sertão"`). Como `crimes.aisp` é Integer, 1533 de 2151 linhas ficam com `aisp = NULL`.

**Ação:** adicionar `aisp_name` (String) ou converter `aisp` para String. Ajustar filtros do frontend que dependem do campo.

### 1.4 Ingestão N+1
Cada linha gera um `SELECT` (busca de duplicata) e um `INSERT` individual. Para 2 mil linhas é aceitável; para 100 mil torna-se lento. `convert_crime_data` também usa `iterrows`, que é a forma mais lenta de percorrer um DataFrame.

**Ação:** carregar o conjunto de chaves existentes uma única vez, usar `bulk_insert_mappings`, e vetorizar a conversão com operações de coluna do pandas.

### 1.5 Erros silenciosamente engolidos
`convert_crime_data` e `load_data_to_database` usam `except Exception: print(...)` (e em alguns pontos `except:` sem tipo). O upload responde "sucesso" mesmo quando 30% das linhas foram descartadas. Foi exatamente esse comportamento que escondeu a quebra de formato de data: 100% das linhas eram descartadas sem nenhum erro visível.

**Ação:** acumular linhas rejeitadas com motivo (`rejected: [{row, reason}]`), devolver no JSON de resposta do upload e gravar contagem em `UploadLog`. Substituir `except:` nu por exceções específicas.

### 1.6 Validação geoespacial
Coordenadas fora da bounding box da Bahia (lat `-18.4` a `-8.5`, lon `-46.7` a `-37.3`) indicam erro de digitação, não ponto real. Registros com `LOGRADOURO = "PENDENTE GEORREFERENCIAMENTO"` entram no mapa como se fossem posições exatas.

**Ação:** rejeitar coordenadas fora da bbox; adicionar flag `geocoded` (Boolean) para marcar pontos aproximados e permitir que o frontend os diferencie.

## 2. Código

### 2.1 Raiz de import inconsistente
`upload_controller.py` importa `from backend.services.cache_service import ...`, enquanto o restante do backend usa `from services. ...`. `ingest_2026.py` precisou de um `try/except ImportError` apenas para contornar isso.

**Ação:** escolher uma única raiz de pacote, ajustar `PYTHONPATH`/`sys.path` no ponto de entrada e remover os fallbacks.

### 2.2 `routes.py` com 1444 linhas
Arquivo único concentra todas as rotas.

**Ação:** quebrar em blueprints por domínio (`crimes`, `analytics`, `upload`, `chat`, `auth`).

### 2.3 Caminhos relativos dependentes do cwd
`os.path.join('data', filename)` em `upload_controller` e `save_converted_data` funciona apenas se o processo for iniciado de `backend/`.

**Ação:** definir `DATA_DIR` absoluto em `app.config` e usá-lo em todos os pontos.

### 2.4 Cobertura de testes
`backend/tests` cobre rotas e parsing de linguagem natural. `convert_crime_data` não tem nenhum teste, e foi onde o formato novo quebrou.

**Ação:** adicionar testes com fixtures para: formato antigo (`DD-MM-YYYY`), formato `dados.csv` (ISO com `T` + `ANO/MES/DIA`), coordenadas corrompidas (`-16.721418.`, `-1..861011`), data inválida, `AISP` numérico e nominal.

## 3. Repositório e segurança

### 3.1 `.env` versionado
`git ls-files .env` retorna o arquivo. O `.gitignore` tem a regra, mas o arquivo foi commitado antes dela existir. Segredos estão no histórico.

**Ação:** `git rm --cached .env`, rotacionar todas as credenciais contidas nele, manter apenas `.env.example`.

### 3.2 `chroma_db/*.bin` versionado
Binários do ChromaDB mudam a cada reindexação e incham o histórico.

**Ação:** adicionar `chroma_db/` ao `.gitignore`, `git rm -r --cached`, e regenerar o índice no build/deploy.

### 3.3 Migration já aplicada foi editada
`backend/migrations/versions/f2bc473c8eee_add_unidade_column_to_users_table.py` aparece modificada no working tree. Editar uma migration já executada gera drift entre ambientes.

**Ação:** reverter a edição e criar uma nova migration para a mudança desejada.

### 3.4 Artefatos rastreados
`.DS_Store` e `__pycache__/` ainda aparecem no `git status` como rastreados (os `.pyc` como deletados).

**Ação:** `git rm -r --cached` nesses caminhos e commitar a limpeza.

## Por onde começar

1. Itens **1.1 + 1.2 + 1.3** em uma única migration: resolvem perda de dados que acontece hoje.
2. Item **2.4**: evita repetir o bug de formato silencioso.
3. Item **3.1**: risco de segurança ativo.
