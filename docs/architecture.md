# Architecture Overview

## System Architecture

SubtractProxy is designed with simplicity and extensibility in mind, following a modular architecture pattern.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    HTTP Client   │────▶│  Proxy Server    │────▶│  Target Server   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                               │      ▲
                               │      │
                               ▼      │
                         ┌──────────────────┐
                         │   LLM Filter     │
                         └──────────────────┘
                               │      ▲
                               │      │
                               ▼      │
                         ┌──────────────────┐
                         │  Config Manager  │
                         └──────────────────┘
```

## Core Components

### 1. Proxy Server (`src/proxy/`)
- Handles HTTP/HTTPS requests
- Manages connection pooling
- Implements request/response pipeline
- Provides error handling and logging

### 2. LLM Filter (`src/llm/`)
- Integrates with Ollama and OpenRouter
- Implements content analysis
- Applies filtering rules
- Manages model interactions

### 3. Config Manager (`src/config/`)
- Loads configuration files
- Validates settings
- Provides runtime configuration updates
- Manages environment variables

### 4. Utils (`src/utils/`)
- Logging system
- Error handling
- Common utilities
- Type definitions

## Data Flow

1. **Request Flow**
   ```
   Client Request
   └─▶ Proxy Server
       └─▶ Request Validation
           └─▶ URL/Header Processing
               └─▶ Target Server Request
   ```

2. **Response Flow**
   ```
   Target Server Response
   └─▶ Content Buffer
       └─▶ LLM Analysis
           └─▶ Content Filtering
               └─▶ Client Response
   ```

## Design Principles

### 1. Simplicity
- Minimal dependencies
- Clear separation of concerns
- Straightforward configuration
- Intuitive API design

### 2. Extensibility
- Modular component design
- Plugin architecture for filters
- Custom rule support
- Flexible configuration

### 3. Performance
- Efficient request handling
- Minimal memory footprint
- Optimized LLM interactions
- Smart caching strategies

### 4. Reliability
- Comprehensive error handling
- Graceful degradation
- Request timeout management
- Circuit breaker patterns

## Security Considerations

### 1. Request Security
- TLS/SSL handling
- Certificate validation
- HTTP header sanitization
- URL validation

### 2. Content Security
- Content-Type validation
- Size limitations
- Malicious content detection
- Safe content transformation

### 3. System Security
- Rate limiting
- Resource constraints
- Error exposure control
- Logging security

## Future Enhancements

1. **Performance Optimization**
   - Response caching
   - Connection pooling
   - Request batching
   - Parallel processing

2. **Feature Extensions**
   - Authentication support
   - Custom filter plugins
   - Advanced monitoring
   - API enhancements

3. **Security Improvements**
   - Access control
   - Audit logging
   - Threat detection
   - Security headers
