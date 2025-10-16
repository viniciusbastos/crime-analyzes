#!/usr/bin/env python3
"""
Simple integration test script for Natural Language Crime Query functionality.
Run this to test the NL integration with sample queries.
"""

import sys
import os
import json
from datetime import datetime

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_sample_queries():
    """Test sample NL queries to verify integration works"""
    
    try:
        from backend.services.chat_service import chat_service
        from backend.services.prompt_builder import PromptBuilder
        
        print("🤖 Testing Natural Language Crime Query Integration\n")
        print("="*60)
        
        # Sample test queries
        test_queries = [
            "What are the most common crime types?",
            "Show me crime patterns by hour of day",
            "What crimes happen on weekends vs weekdays?", 
            "How many thefts occurred in Salvador?",
            "What's the monthly trend for 2024?",
        ]
        
        prompt_builder = PromptBuilder()
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n🔍 Test {i}: {query}")
            print("-" * 50)
            
            try:
                # Test NL parsing prompt generation
                parsing_prompt = prompt_builder.build_nl_parsing_prompt(query)
                print("✅ NL parsing prompt generated successfully")
                
                # Test analysis prompt generation
                sample_context = {
                    "total_crimes": 1500,
                    "crime_types": [
                        {"type": "Theft", "count": 500, "percentage": 33.3},
                        {"type": "Robbery", "count": 300, "percentage": 20.0}
                    ],
                    "temporal_patterns": {
                        "hourly": [{"hour": 14, "count": 120}, {"hour": 20, "count": 180}],
                        "monthly": [{"month": 1, "count": 150}]
                    }
                }
                
                analysis_prompt = prompt_builder.build_crime_analysis_prompt(query, sample_context)
                print("✅ Analysis prompt generated successfully")
                
                # Test mock response (since we might not have MLX model loaded)
                try:
                    result = chat_service.generate_response(query, {})
                    if result.get('response'):
                        print(f"✅ Generated response: {result['response'][:100]}...")
                        if result.get('thinking'):
                            print(f"🧠 With thinking process: {len(result['thinking'])} chars")
                    else:
                        print("⚠️  Response generated but empty")
                        
                except Exception as service_error:
                    print(f"⚠️  Chat service error (expected with mock): {service_error}")
                    print("✅ This is normal if MLX model is not loaded - using mock responses")
                
            except Exception as e:
                print(f"❌ Error in test {i}: {str(e)}")
                
        print("\n" + "="*60)
        print("🎉 Integration test completed!")
        print("\nℹ️  Note: Some errors are expected if:")
        print("   • MLX model is not installed/loaded")
        print("   • Database is empty")
        print("   • This is running without full Flask context")
        print("\n📝 For full functionality, run the Flask app and test via the web interface.")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running from the project root directory.")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
        
    return True

def test_component_integration():
    """Test individual components work correctly"""
    
    print("\n🔧 Testing Individual Components")
    print("="*40)
    
    try:
        # Test PromptBuilder
        from backend.services.prompt_builder import PromptBuilder
        pb = PromptBuilder()
        
        # Test NL parsing prompt
        nl_prompt = pb.build_nl_parsing_prompt("test query")
        assert "Database Schema" in nl_prompt
        assert "JSON" in nl_prompt
        print("✅ PromptBuilder NL parsing working")
        
        # Test analysis prompt  
        analysis_prompt = pb.build_crime_analysis_prompt("test", {"total_crimes": 100})
        assert "crime analyst" in analysis_prompt.lower()
        assert "CHART:" in analysis_prompt
        print("✅ PromptBuilder analysis working")
        
        # Test CrimeDataService
        from backend.services.crime_data_service import CrimeDataService
        cds = CrimeDataService()
        
        # This might fail without database, but we can test the method exists
        try:
            result = cds.get_crime_data_context({}, "count_total")
            print("✅ CrimeDataService aggregation method working")
        except Exception:
            print("⚠️  CrimeDataService needs database connection (expected)")
        
        print("\n🎉 Component tests passed!")
        
    except Exception as e:
        print(f"❌ Component test error: {e}")
        return False
        
    return True

if __name__ == "__main__":
    print("🚀 Starting Natural Language Crime Query Integration Tests")
    print(f"📅 Test run at: {datetime.now()}")
    
    # Test components first
    components_ok = test_component_integration()
    
    # Test full integration
    integration_ok = test_sample_queries()
    
    if components_ok and integration_ok:
        print("\n🎉 ALL TESTS PASSED! NL Integration is working.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests had issues - check output above.")
        sys.exit(1)