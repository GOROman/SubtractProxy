# Setup Guide

## Prerequisites

### System Requirements
- Node.js 18.x or higher
- npm or yarn
- Git
- 2GB RAM minimum
- 1GB free disk space

### Optional Requirements
- Ollama (for local LLM filtering)
- OpenRouter API key (for cloud LLM filtering)

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/GOROman/SubtractProxy.git
cd SubtractProxy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configuration Setup

Create a configuration file by copying the example:

```bash
cp config.example.json config.json
```

#### Basic Configuration
```json
{
  "port": 8080,
  "host": "127.0.0.1",
  "ignoreRobotsTxt": false,
  "llm": {
    "enabled": true,
    "type": "ollama",
    "model": "gemma",
    "baseUrl": "http://localhost:11434"
  }
}
```

#### OpenRouter Configuration
```json
{
  "llm": {
    "type": "openrouter",
    "apiKey": "your-api-key",
    "model": "openai/gpt-3.5-turbo"
  }
}
```

## Development Setup

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Tests
```bash
npm test
```

### 4. Lint Code
```bash
npm run lint
```

## Production Deployment

### 1. Build
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Process Management
Using PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name subtractproxy
```

## Configuration Details

### 1. Server Configuration
```typescript
interface ServerConfig {
  port: number;        // Server port (default: 8080)
  host: string;        // Host address (default: 127.0.0.1)
  timeout: number;     // Request timeout in ms (default: 30000)
  maxBodySize: string; // Max request body size (default: "1mb")
}
```

### 2. LLM Configuration
```typescript
interface LLMConfig {
  enabled: boolean;    // Enable LLM filtering
  type: "ollama" | "openrouter";
  model: string;       // Model name
  baseUrl?: string;    // Ollama server URL
  apiKey?: string;     // OpenRouter API key
  timeout: number;     // LLM request timeout
}
```

### 3. Logging Configuration
```typescript
interface LogConfig {
  level: "debug" | "info" | "warn" | "error";
  file?: string;      // Log file path
  format: "json" | "text";
  rotation: {
    enabled: boolean;
    maxSize: string;  // Max file size before rotation
    maxFiles: number; // Number of files to keep
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `HOST` | Host address | 127.0.0.1 |
| `NODE_ENV` | Environment | development |
| `LOG_LEVEL` | Logging level | info |
| `LLM_API_KEY` | OpenRouter API key | - |

## Troubleshooting

### 1. Installation Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules`
- Reinstall dependencies: `npm install`

### 2. Runtime Issues
- Check logs: `tail -f proxy.log`
- Verify port availability: `lsof -i :8080`
- Monitor memory: `ps aux | grep node`

### 3. LLM Integration
- Test Ollama: `curl http://localhost:11434/api/health`
- Verify API key: Check environment variables
- Monitor model status: Check server logs

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: Check latest docs
- Community: Join Discord server
