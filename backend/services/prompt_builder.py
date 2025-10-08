import json
from typing import Dict, Any


class PromptBuilder:
    """Builds prompts for LLM crime analysis"""

    def build_crime_analysis_prompt(self, user_query: str, data_context: Dict[str, Any], rag_context: str = None) -> str:
        """Build a comprehensive prompt for the LLM with crime data context"""

        rag_section = ""
        if rag_context:
            rag_section = f"""

RELEVANT KNOWLEDGE FROM CRIME ANALYSIS DATABASE:
{rag_context}"""

        system_prompt = f"""You are an expert crime analyst AI assistant. You have access to comprehensive crime data and can provide detailed insights, trends, and recommendations.

CRIME DATA CONTEXT:
{json.dumps(data_context, indent=2)}{rag_section}

INSTRUCTIONS:
1. Always base your analysis on the provided data context
2. Use portuguese if the user query is in portuguese, otherwise use english
3. Be specific with numbers, percentages, and trends
3. Provide actionable insights and recommendations
4. Use clear, professional language
5. If data is insufficient for a question, clearly state this
6. Focus on patterns, trends, and prevention strategies
7. Consider temporal, geographic, and categorical factors
8. Use structured formats like tables or lists when appropriate
9. Cite specific data points from the context to support your analysis
10. If the user asks for code or technical details, provide accurate and relevant information



IMPORTANT: Show your reasoning process by wrapping your thinking in <thinking> tags before providing the final answer.

USER QUESTION: {user_query}
Provide a detailed analysis based on the above instructions and data context."""

        return system_prompt

    def build_nl_parsing_prompt(self, user_query: str) -> str:
        """Build a prompt to parse natural language query into database filters JSON"""

        schema_info = """
Database Schema (Crimes table):
- id: Integer (primary key)
- crime_type: String (e.g., 'Theft', 'Homicide', 'Robbery')
- date_time: DateTime (e.g., '2024-01-15 18:30:00')
- latitude: Float
- longitude: Float
- address: Text
- city: String (e.g., 'Salvador', 'Sao Paulo')
- severity: String (e.g., 'High', 'Low')
- description: Text

Supported filters:
- crime_type: str or list[str]
- start_date: str 'YYYY-MM-DD'
- end_date: str 'YYYY-MM-DD'
- city: str or list[str]
- time_range: str ('00-06', '06-12', '12-18', '18-24') for hours
- day_of_week: str ('weekdays', 'weekends', 'monday', 'tuesday', etc.)
- month: int (1-12)
- aggregation: str (optional: 'count_total', 'count_by_month', 'count_by_city', 'trends_hourly', 'trends_weekly')

Output ONLY valid JSON: {{"filters": {{...}}, "aggregation": "str or null", "intent": "brief description"}}
Do not include explanations or other text.
"""

        prompt = f"""You are a query parser for a crime analysis database. Parse the user's natural language question into structured filters for querying the crimes table.

{schema_info}

USER QUERY: {user_query}

Parse and output ONLY JSON in this exact format:
{{
  "filters": {{
    "crime_type": "str or null",
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null",
    "city": "str or null",
    "time_range": "one of supported or null",
    "day_of_week": "one of supported or null",
    "month": integer or null
  }},
  "aggregation": "count_total or count_by_month or count_by_city or trends_hourly or trends_weekly or null",
  "intent": "brief summary of what the query asks (e.g., 'total thefts in Salvador 2024')"
}}

Ensure dates are in YYYY-MM-DD format. If query is vague, use null for unclear fields. Respond only with the JSON object."""

        return prompt