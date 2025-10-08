import redis
import json
import hashlib
from flask import current_app
from flask_caching import Cache
from datetime import timedelta
import pickle
from functools import wraps

# Initialize Flask-Caching
cache = Cache()

def init_cache(app):
    """Initialize cache with Flask app (Redis if available, otherwise simple cache)"""
    try:
        # Try to connect to Redis first
        import redis
        test_client = redis.Redis(
            host=app.config.get('REDIS_HOST', 'localhost'),
            port=app.config.get('REDIS_PORT', 6379),
            db=app.config.get('REDIS_DB', 0),
            password=app.config.get('REDIS_PASSWORD', None),
            socket_connect_timeout=2,
            socket_timeout=2
        )
        test_client.ping()  # Test connection

        # Redis is available, use it
        cache_config = {
            'CACHE_TYPE': 'redis',
            'CACHE_REDIS_HOST': app.config.get('REDIS_HOST', 'localhost'),
            'CACHE_REDIS_PORT': app.config.get('REDIS_PORT', 6379),
            'CACHE_REDIS_DB': app.config.get('REDIS_DB', 0),
            'CACHE_REDIS_PASSWORD': app.config.get('REDIS_PASSWORD', None),
            'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_TIMEOUT', 300),
            'CACHE_KEY_PREFIX': 'crime_analysis:'
        }
        print("✅ Redis cache initialized successfully")

    except Exception as e:
        # Redis not available, fall back to simple cache
        print(f"⚠️  Redis not available ({str(e)}), using simple cache")
        cache_config = {
            'CACHE_TYPE': 'simple',
            'CACHE_DEFAULT_TIMEOUT': 300,
            'CACHE_KEY_PREFIX': 'crime_analysis:'
        }

    app.config.update(cache_config)
    cache.init_app(app)

    return cache

def generate_cache_key(endpoint, params):
    """Generate a unique cache key based on endpoint and parameters"""
    # Sort parameters for consistent key generation
    sorted_params = sorted(params.items()) if params else []
    key_string = f"{endpoint}:{json.dumps(sorted_params, sort_keys=True)}"
    
    # Create hash for shorter, consistent keys
    key_hash = hashlib.md5(key_string.encode('utf-8')).hexdigest()
    return f"api:{endpoint}:{key_hash}"

def cached_api_call(timeout=300):
    """Decorator to cache API responses"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            
            # Generate cache key from endpoint and request parameters
            endpoint = f.__name__
            params = dict(request.args)
            cache_key = generate_cache_key(endpoint, params)
            
            # Try to get cached result
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                current_app.logger.info(f"Cache HIT for {endpoint}: {cache_key}")
                return cached_result
            
            # Call the function and cache the result
            current_app.logger.info(f"Cache MISS for {endpoint}: {cache_key}")
            result = f(*args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)
            
            return result
        return decorated_function
    return decorator

def invalidate_related_cache(patterns):
    """Invalidate cache keys matching patterns"""
    try:
        redis_client = cache.cache._write_client
        for pattern in patterns:
            keys = redis_client.keys(f"crime_analysis:api:{pattern}*")
            if keys:
                redis_client.delete(*keys)
                current_app.logger.info(f"Invalidated {len(keys)} cache keys matching {pattern}")
    except Exception as e:
        current_app.logger.error(f"Error invalidating cache: {str(e)}")

def clear_all_cache():
    """Clear all cache"""
    try:
        cache.clear()
        current_app.logger.info("All cache cleared")
    except Exception as e:
        current_app.logger.error(f"Error clearing cache: {str(e)}")

class CacheManager:
    """Cache manager for handling complex cache operations"""
    
    @staticmethod
    def set_with_tags(key, value, timeout=300, tags=None):
        """Set cache with tags for easier invalidation"""
        cache.set(key, value, timeout=timeout)
        
        if tags:
            for tag in tags:
                tag_key = f"tag:{tag}"
                tagged_keys = cache.get(tag_key) or []
                if key not in tagged_keys:
                    tagged_keys.append(key)
                    cache.set(tag_key, tagged_keys, timeout=timeout)
    
    @staticmethod
    def invalidate_by_tag(tag):
        """Invalidate all cache entries with a specific tag"""
        tag_key = f"tag:{tag}"
        tagged_keys = cache.get(tag_key) or []
        
        for key in tagged_keys:
            cache.delete(key)
        
        cache.delete(tag_key)
        current_app.logger.info(f"Invalidated {len(tagged_keys)} cache entries with tag: {tag}")
    
    @staticmethod
    def clear_all_cache():
        """Clear all cache entries"""
        try:
            cache.clear()
            current_app.logger.info("All cache cleared via CacheManager")
            return True
        except Exception as e:
            current_app.logger.error(f"Error clearing cache via CacheManager: {str(e)}")
            return False

    @staticmethod
    def get_cache_stats():
        """Get cache statistics"""
        try:
            # Check if we're using Redis or simple cache
            if hasattr(cache.cache, '_write_client') and cache.cache._write_client:
                # Redis cache
                redis_client = cache.cache._write_client
                info = redis_client.info()

                return {
                    'cache_type': 'redis',
                    'connected_clients': info.get('connected_clients', 0),
                    'used_memory_human': info.get('used_memory_human', '0B'),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0),
                    'total_commands_processed': info.get('total_commands_processed', 0),
                    'status': 'connected'
                }
            else:
                # Simple cache (in-memory)
                return {
                    'cache_type': 'simple',
                    'status': 'in-memory cache active',
                    'note': 'Redis not available, using simple cache',
                    'connected_clients': 1,  # Local process
                    'used_memory_human': 'Variable',
                    'keyspace_hits': 'N/A',
                    'keyspace_misses': 'N/A',
                    'total_commands_processed': 'N/A'
                }
        except Exception as e:
            # Log error if we have app context, otherwise just return error stats
            try:
                current_app.logger.error(f"Error getting cache stats: {str(e)}")
            except RuntimeError:
                # Outside app context, just continue
                pass
            return {
                'cache_type': 'unknown',
                'status': 'error',
                'error': str(e),
                'connected_clients': 0,
                'used_memory_human': '0B',
                'keyspace_hits': 0,
                'keyspace_misses': 0,
                'total_commands_processed': 0
            }

# Cache timeout configurations for different data types
CACHE_TIMEOUTS = {
    'heatmap': 600,        # 10 minutes - geographic data changes less frequently
    'density': 600,        # 10 minutes
    'summary': 300,        # 5 minutes - basic stats
    'temporal': 900,       # 15 minutes - temporal analysis is compute-intensive
    'spatial': 900,        # 15 minutes
    'trends': 1800,        # 30 minutes - trend analysis is very compute-intensive
    'forecast': 3600,      # 1 hour - forecasts are most compute-intensive
    'crimes': 60,          # 1 minute - raw data queries for real-time needs
    'export': 300          # 5 minutes
}

def get_cache_timeout(endpoint):
    """Get appropriate cache timeout for an endpoint"""
    return CACHE_TIMEOUTS.get(endpoint, 300)  # Default 5 minutes