from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Global limiter instance
# Setting a default low limit for demonstration/safety as requested
limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
