from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.datastructures import URL


class TrailingSlashMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically add trailing slashes to paths if missing.
    Rewrites the request path internally to prevent redirects.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get the path
        path = request.url.path
        
        # Skip if path already has trailing slash or is root
        if path.endswith('/') or path == '':
            return await call_next(request)
        
        # Skip for files with extensions (e.g., /openapi.json)
        if '.' in path.split('/')[-1]:
            return await call_next(request)
        
        # Rewrite the path by modifying the scope
        request.scope['path'] = path + '/'
        
        # Rebuild the URL with the new path
        request.scope['raw_path'] = (path + '/').encode('utf-8')
        
        # Continue with the modified request
        return await call_next(request)
