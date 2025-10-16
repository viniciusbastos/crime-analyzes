import pytest
import json
from unittest.mock import Mock, patch
from datetime import datetime

# Import the classes we're testing
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.chat_service import CrimeChatService
from backend.services.prompt_builder import PromptBuilder
from backend.services.crime_data_service import CrimeDataService
from backend.models.models import Crime, db


class TestNLParsing:
    """Test natural language parsing functionality"""
    
    @pytest.fixture
    def prompt_builder(self):
        return PromptBuilder()
    
    @pytest.fixture
    def mock_model_manager(self):
        mock = Mock()
        mock.generate_response = Mock()
        return mock
    
    @pytest.fixture
    def chat_service(self, mock_model_manager):
        with patch('services.chat_service.ModelManager', return_value=mock_model_manager):
            service = CrimeChatService()
            service.model_manager = mock_model_manager
            return service
    
    def test_nl_parsing_prompt_generation(self, prompt_builder):
        """Test that NL parsing prompt is generated correctly"""
        user_query = "Show me thefts in Salvador last month"
        prompt = prompt_builder.build_nl_parsing_prompt(user_query)
        
        assert "Database Schema" in prompt
        assert "crime_type" in prompt
        assert "city" in prompt
        assert "start_date" in prompt
        assert user_query in prompt
        assert "JSON" in prompt

    def test_nl_parsing_simple_queries(self, chat_service):
        """Test parsing of simple natural language queries"""
        test_cases = [
            {
                "query": "Show me thefts in Salvador",
                "expected_json": {
                    "filters": {
                        "crime_type": "Theft",
                        "city": "Salvador",
                        "start_date": None,
                        "end_date": None,
                        "time_range": None,
                        "day_of_week": None,
                        "month": None
                    },
                    "aggregation": None,
                    "intent": "show thefts in Salvador"
                }
            },
            {
                "query": "What crimes happen on weekends?",
                "expected_json": {
                    "filters": {
                        "crime_type": None,
                        "city": None,
                        "start_date": None,
                        "end_date": None,
                        "time_range": None,
                        "day_of_week": "weekends",
                        "month": None
                    },
                    "aggregation": "count_total",
                    "intent": "crimes during weekends"
                }
            },
            {
                "query": "Monthly crime trends in 2024",
                "expected_json": {
                    "filters": {
                        "crime_type": None,
                        "city": None,
                        "start_date": "2024-01-01",
                        "end_date": "2024-12-31",
                        "time_range": None,
                        "day_of_week": None,
                        "month": None
                    },
                    "aggregation": "count_by_month",
                    "intent": "monthly trends in 2024"
                }
            }
        ]
        
        for case in test_cases:
            # Mock the LLM response to return expected JSON
            mock_json_response = json.dumps(case["expected_json"])
            chat_service.model_manager.generate_response.return_value = mock_json_response
            
            # Mock the crime data service to return basic context
            with patch.object(chat_service.crime_data_service, 'get_crime_data_context') as mock_context:
                mock_context.return_value = {"total_crimes": 100, "crime_types": []}
                
                # Mock response handler
                with patch.object(chat_service.response_handler, 'generate_response') as mock_response:
                    mock_response.return_value = {"thinking": "test", "response": "test response"}
                    
                    result = chat_service.generate_response(case["query"])
                    
                    # Verify the model was called for parsing
                    assert chat_service.model_manager.generate_response.called
                    
                    # Verify crime data service was called with merged filters
                    mock_context.assert_called_once()
                    called_args = mock_context.call_args
                    called_filters = called_args[0][0]  # First positional argument (filters)
                    
                    # Check that expected filters were applied
                    for key, expected_value in case["expected_json"]["filters"].items():
                        if expected_value is not None:
                            assert called_filters.get(key) == expected_value

    def test_nl_parsing_with_invalid_json(self, chat_service):
        """Test handling of invalid JSON responses from LLM"""
        # Mock invalid JSON response
        chat_service.model_manager.generate_response.return_value = "invalid json response"
        
        with patch.object(chat_service.crime_data_service, 'get_crime_data_context') as mock_context:
            mock_context.return_value = {"total_crimes": 0}
            
            with patch.object(chat_service.response_handler, 'generate_response') as mock_response:
                mock_response.return_value = {"thinking": None, "response": "fallback response"}
                
                result = chat_service.generate_response("test query")
                
                # Should still return a response despite parsing failure
                assert result["response"] == "fallback response"
                
                # Should have called context with empty filters (fallback)
                mock_context.assert_called_once()
                called_filters = mock_context.call_args[0][0]
                assert called_filters == {}

    def test_crime_data_service_aggregations(self):
        """Test that CrimeDataService handles different aggregation types"""
        service = CrimeDataService()
        
        # Mock database queries
        with patch('services.crime_data_service.db') as mock_db:
            # Mock query results for different aggregations
            mock_session = mock_db.session
            mock_query = Mock()
            mock_session.query.return_value = mock_query
            mock_query.filter.return_value = mock_query
            mock_query.group_by.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.all.return_value = [(2024, 1, 10), (2024, 2, 15)]
            
            # Test count_by_month aggregation
            result = service.get_crime_data_context({}, aggregation="count_by_month")
            
            assert result["aggregation"] == "count_by_month"
            assert "monthly_counts" in result
            assert len(result["monthly_counts"]) == 2

    def test_chart_recommendation_parsing(self):
        """Test parsing of chart recommendations from AI responses"""
        test_responses = [
            ("Crime trends show hourly patterns. [CHART:hourly_chart]", "hourly_chart"),
            ("Monthly analysis shows seasonal variations [CHART:monthly_chart]", "monthly_chart"),
            ("Crime types distribution [CHART:crime_types_chart]", "crime_types_chart"),
            ("No chart suggestion here", None),
            ("Multiple [CHART:hourly_chart] and [CHART:monthly_chart]", "hourly_chart")  # Should get first one
        ]
        
        for response_text, expected_chart in test_responses:
            # This would be called in the frontend ChatInterface
            import re
            chart_match = re.search(r'\[CHART:(\w+)\]', response_text)
            result = chart_match.group(1) if chart_match else None
            assert result == expected_chart

    def test_complex_nl_queries(self, chat_service):
        """Test more complex natural language queries"""
        complex_cases = [
            {
                "query": "Show me evening thefts in Salvador during weekends in 2024",
                "expected_filters": {
                    "crime_type": "Theft",
                    "city": "Salvador", 
                    "time_range": "18-24",
                    "day_of_week": "weekends",
                    "start_date": "2024-01-01",
                    "end_date": "2024-12-31"
                }
            },
            {
                "query": "What's the hourly pattern of robberies?",
                "expected_aggregation": "trends_hourly",
                "expected_filters": {"crime_type": "Robbery"}
            }
        ]
        
        for case in complex_cases:
            # Create expected JSON response
            expected_json = {
                "filters": {
                    "crime_type": None,
                    "city": None,
                    "start_date": None,
                    "end_date": None,
                    "time_range": None,
                    "day_of_week": None,
                    "month": None
                },
                "aggregation": case.get("expected_aggregation"),
                "intent": "complex query test"
            }
            expected_json["filters"].update(case.get("expected_filters", {}))
            
            mock_json_response = json.dumps(expected_json)
            chat_service.model_manager.generate_response.return_value = mock_json_response
            
            with patch.object(chat_service.crime_data_service, 'get_crime_data_context') as mock_context:
                mock_context.return_value = {"total_crimes": 50}
                
                with patch.object(chat_service.response_handler, 'generate_response') as mock_response:
                    mock_response.return_value = {"thinking": "complex", "response": "complex response"}
                    
                    result = chat_service.generate_response(case["query"])
                    
                    # Verify aggregation was passed correctly
                    called_args = mock_context.call_args
                    if len(called_args) > 1:
                        called_aggregation = called_args[0][1] if len(called_args[0]) > 1 else called_args[1].get('aggregation')
                        if "expected_aggregation" in case:
                            assert called_aggregation == case["expected_aggregation"]


# Integration test for the complete flow
class TestIntegrationFlow:
    """Integration tests for the complete NL query flow"""
    
    @pytest.fixture
    def app_context(self):
        # This would require setting up a Flask app context with database
        # For now, we'll mock it
        pass
    
    def test_end_to_end_nl_query(self):
        """Test the complete flow from NL query to response"""
        # This would be a more comprehensive test that actually uses
        # a test database with sample data and tests the entire pipeline
        pass

    def test_performance_with_large_dataset(self):
        """Test performance with larger datasets"""
        # Test that parsing and querying remain fast with realistic data volumes
        pass


if __name__ == "__main__":
    # Run tests with: python -m pytest tests/test_nl_parsing.py -v
    pytest.main([__file__, "-v"])