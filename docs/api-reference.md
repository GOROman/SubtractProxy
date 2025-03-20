# API Reference

## Core API Endpoints

### Proxy Endpoints

#### GET /*
Handles all HTTP/HTTPS proxy requests.

**Request**
- Method: GET/POST/PUT/DELETE/etc.
- Headers: Standard HTTP headers
- Body: Any valid HTTP body

**Response**
- Status: Varies based on target response
- Headers: Proxied response headers
- Body: Filtered content based on LLM analysis

#### POST /api/config
Updates proxy configuration at runtime.

**Request**
```typescript
{
  port?: number;
  host?: string;
  llm?: {
    enabled: boolean;
    type: "ollama" | "openrouter";
    model: string;
    baseUrl: string;
  };
  logging?: {
    level: "debug" | "info" | "warn" | "error";
    file: string;
  };
  userAgent?: {
    enabled: boolean;
    rotate: boolean;
    value: string;
    presets: string[];
  };
}
```

**Response**
```typescript
{
  success: boolean;
  message: string;
  config: ProxyConfig;
}
```

#### GET /api/status
Returns current proxy server status.

**Response**
```typescript
{
  status: "running" | "error";
  uptime: number;
  requests: {
    total: number;
    filtered: number;
    blocked: number;
  };
  llm: {
    status: "connected" | "disconnected";
    model: string;
    type: string;
  };
}
```

## Error Handling

### Error Responses
All API endpoints return consistent error responses:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### HTTP Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 502: Bad Gateway
- 504: Gateway Timeout

## Rate Limiting
- Default: 100 requests per minute per IP
- Configurable via config.json
- Headers:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Authentication
Currently, the API does not require authentication. Future versions may implement:
- API key authentication
- JWT-based authentication
- Role-based access control
