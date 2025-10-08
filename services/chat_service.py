from typing import Dict, Any
from .model_manager import ModelManager
from .crime_data_service import CrimeDataService
from .prompt_builder import PromptBuilder
from .response_handler import ResponseHandler
from .mock_response_builder import MockResponseBuilder


class CrimeChatService:
    """Service for handling LLM-powered chat interactions with crime data"""

    def __init__(self, model_path: str = "mlx-community/gemma-3-12b-it-4bit"):
        """Initialize the chat service with MLX model"""
        self.model_manager = ModelManager(model_path)
        self.crime_data_service = CrimeDataService()
        self.prompt_builder = PromptBuilder()
        self.mock_response_builder = MockResponseBuilder()
        self.response_handler = ResponseHandler(self.model_manager, self.mock_response_builder)

    def generate_response(self, user_query: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a response using the local LLM, returning both thinking and final answer"""
        try:
            # Get crime data context first
            data_context = self.crime_data_service.get_crime_data_context(filters or {})
            print(f"Data context retrieved: {len(str(data_context))} characters")

            return self.response_handler.generate_response(user_query, data_context)

        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            print(error_msg)
            return {
                'thinking': None,
                'response': f"I apologize, but I encountered an error while analyzing your crime data: {str(e)}. Please try again or contact support if the issue persists."
            }


# Global chat service instance
chat_service = CrimeChatService()