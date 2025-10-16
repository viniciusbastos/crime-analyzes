from typing import Dict, Any, List
from .model_manager import ModelManager
from .crime_data_service import CrimeDataService
from .prompt_builder import PromptBuilder
from .response_handler import ResponseHandler
from .mock_response_builder import MockResponseBuilder
from .cache_service import CacheManager
from backend.models.models import db, QueryHistory
import time
import json
import hashlib

# Import RAG service if available
try:
    from .rag_service import rag_service
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("Warning: RAG service not available - chromadb not installed")


class CrimeChatService:
    """Service for handling LLM-powered chat interactions with crime data"""

    def __init__(self, model_path: str = "mlx-community/gpt-oss-20b-MXFP4-Q8"):
        """Initialize the chat service with MLX model"""
        self.model_manager = ModelManager(model_path)
        self.crime_data_service = CrimeDataService()
        self.prompt_builder = PromptBuilder()
        self.mock_response_builder = MockResponseBuilder()
        self.response_handler = ResponseHandler(self.model_manager, self.mock_response_builder, self.prompt_builder)

    def generate_response(self, user_query: str, filters: Dict[str, Any] = None, user_id: int = None) -> Dict[str, Any]:
        """Generate a response using the local LLM with RAG augmentation, returning both thinking and final answer"""
        start_time = time.time()

        # Create cache key from query and filters
        cache_key = self._create_cache_key(user_query, filters or {})

        # Check cache first
        cached_result = CacheManager.get(cache_key)
        if cached_result:
            print(f"Cache hit for query: {user_query[:50]}...")
            # Still track the cached query for analytics
            response_time_ms = int((time.time() - start_time) * 1000)
            self._track_query(user_query, cached_result, filters or {}, response_time_ms, user_id, cached=True)
            return cached_result

        try:
            # Retrieve relevant documents from knowledge base (if RAG is available)
            rag_context = ""
            if RAG_AVAILABLE:
                # Check if this is a spatial analysis query
                spatial_keywords = ['spatial', 'hotspot', 'cluster', 'dbscan', 'k-means', 'kmeans', 'mapping', 'geographic', 'location', 'area', 'rio real', 'bahia']
                is_spatial_query = any(keyword in user_query.lower() for keyword in spatial_keywords)

                # Increase results for spatial queries and add more specific context
                n_results = 5 if is_spatial_query else 3

                relevant_docs = rag_service.retrieve_relevant_documents(user_query, n_results=n_results)

                if relevant_docs:
                    # Format RAG context differently for spatial queries
                    if is_spatial_query:
                        rag_context = "\n\nSpatial Analysis Knowledge:\n" + "\n".join([
                            f"• {doc['content']}" for doc in relevant_docs
                        ])
                    else:
                        rag_context = "\n\nRelevant knowledge from crime analysis database:\n" + "\n".join([
                            f"- {doc['content']}" for doc in relevant_docs
                        ])
            else:
                print("RAG service not available - proceeding without knowledge augmentation")

            # Parse natural language query to dynamic filters
            parsing_prompt = self.prompt_builder.build_nl_parsing_prompt(user_query)
            parsing_response = self.model_manager.generate_response(parsing_prompt, max_tokens=500)

            # Initialize variables
            dynamic_filters = {}
            aggregation = None
            intent = ''

            # Extract JSON from response (assume LLM outputs clean JSON)
            try:
                # Find JSON in response (simple extraction)
                json_start = parsing_response.find('{')
                json_end = parsing_response.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    parsed_json = json.loads(parsing_response[json_start:json_end])
                    dynamic_filters = parsed_json.get('filters', {})
                    aggregation = parsed_json.get('aggregation')
                    intent = parsed_json.get('intent', '')
                    print(f"Parsed dynamic filters: {dynamic_filters}, aggregation: {aggregation}")
                else:
                    print("Failed to parse JSON from LLM; using empty dynamic filters")
            except json.JSONDecodeError as je:
                print(f"JSON decode error: {je}; using empty dynamic filters")

            # Merge dynamic filters with input filters (dynamic overrides)
            merged_filters = {** (filters or {}), **dynamic_filters}

            # Get crime data context with merged filters and aggregation
            data_context = self.crime_data_service.get_crime_data_context(merged_filters, aggregation)
            print(f"Data context retrieved: {len(str(data_context))} characters")

            # Pass data context and RAG context separately to response handler
            result = self.response_handler.generate_response(user_query, data_context, intent, rag_context)

            # Cache the result (30 minutes TTL for chat responses)
            CacheManager.set(cache_key, result, timeout=1800)

            # Track query in history
            response_time_ms = int((time.time() - start_time) * 1000)
            self._track_query(user_query, result, merged_filters, response_time_ms, user_id)

            return result

        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            print(error_msg)

            # Track failed query
            response_time_ms = int((time.time() - start_time) * 1000)
            self._track_query(user_query, {'response': error_msg, 'thinking': None}, filters or {}, response_time_ms, user_id)

            return {
                'thinking': None,
                'response': f"I apologize, but I encountered an error while analyzing your crime data: {str(e)}. Please try again or contact support if the issue persists."
            }

        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            print(error_msg)
            return {
                'thinking': None,
                'response': f"I apologize, but I encountered an error while analyzing your crime data: {str(e)}. Please try again or contact support if the issue persists."
            }

    def _create_cache_key(self, user_query: str, filters: Dict[str, Any]) -> str:
        """Create a cache key from query and filters"""
        # Sort filters for consistent hashing
        sorted_filters = json.dumps(filters, sort_keys=True)
        cache_content = f"{user_query}|{sorted_filters}"
        cache_hash = hashlib.md5(cache_content.encode()).hexdigest()
        return f"chat_response_{cache_hash}"

    def _track_query(self, user_query: str, result: Dict[str, Any], filters: Dict[str, Any], response_time_ms: int, user_id: int = None, cached: bool = False):
        """Track query in history database"""
        try:
            query_history = QueryHistory(
                user_query=user_query,
                response=result.get('response', ''),
                thinking=result.get('thinking'),
                filters_applied=json.dumps(filters),
                response_time_ms=response_time_ms,
                user_id=user_id
            )
            db.session.add(query_history)
            db.session.commit()
            cache_status = " (cached)" if cached else ""
            print(f"Query tracked{cache_status}: {len(user_query)} chars, {response_time_ms}ms")
        except Exception as e:
            print(f"Error tracking query: {str(e)}")
            db.session.rollback()

    def get_query_history(self, limit: int = 50, user_id: int = None) -> List[Dict[str, Any]]:
        """Get query history for analytics"""
        try:
            query = QueryHistory.query
            if user_id:
                query = query.filter_by(user_id=user_id)
            history = query.order_by(QueryHistory.timestamp.desc()).limit(limit).all()

            return [{
                'id': h.id,
                'user_query': h.user_query,
                'response': h.response,
                'thinking': h.thinking,
                'filters_applied': json.loads(h.filters_applied) if h.filters_applied else {},
                'timestamp': h.timestamp.isoformat(),
                'response_time_ms': h.response_time_ms,
                'user_id': h.user_id
            } for h in history]
        except Exception as e:
            print(f"Error retrieving query history: {str(e)}")
            return []

    def get_metrics(self) -> Dict[str, Any]:
        """Get basic metrics for the chat service and RAG system"""
        try:
            # Query history metrics
            total_queries = QueryHistory.query.count()

            if total_queries > 0:
                avg_response_time = db.session.query(db.func.avg(QueryHistory.response_time_ms)).scalar() or 0
                min_response_time = db.session.query(db.func.min(QueryHistory.response_time_ms)).scalar() or 0
                max_response_time = db.session.query(db.func.max(QueryHistory.response_time_ms)).scalar() or 0

                # Recent queries (last 24 hours)
                from datetime import datetime, timedelta
                yesterday = datetime.utcnow() - timedelta(days=1)
                recent_queries = QueryHistory.query.filter(QueryHistory.timestamp >= yesterday).count()
            else:
                avg_response_time = min_response_time = max_response_time = recent_queries = 0

            # RAG metrics
            if RAG_AVAILABLE:
                rag_stats = rag_service.get_collection_stats()
            else:
                rag_stats = {"error": "RAG service not available"}

            # Cache metrics
            cache_stats = CacheManager.get_cache_stats()

            return {
                'query_metrics': {
                    'total_queries': total_queries,
                    'recent_queries_24h': recent_queries,
                    'avg_response_time_ms': round(avg_response_time, 2),
                    'min_response_time_ms': min_response_time,
                    'max_response_time_ms': max_response_time
                },
                'rag_metrics': rag_stats,
                'cache_metrics': cache_stats,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting metrics: {str(e)}")
            return {
                'error': str(e),
                'query_metrics': {'total_queries': 0},
                'rag_metrics': {},
                'cache_metrics': {},
                'timestamp': datetime.utcnow().isoformat()
            }


# Global chat service instance
chat_service = CrimeChatService()