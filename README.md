# SubtractProxy

A lightweight proxy server with LLM-powered content filtering capabilities.

## Features

- 🚀 Simple and lightweight HTTP/HTTPS proxy server
- 🤖 LLM-powered content filtering (Ollama, OpenRouter)
- 🔄 Customizable content transformation
- 🛡️ Optional robots.txt bypass
- 🔄 Customizable User-Agent management
- 📝 Comprehensive logging system

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Ollama (if using local LLM filtering)

## Quick Start

1. Clone the repository
```bash
git clone https://github.com/GOROman/SubtractProxy.git
cd SubtractProxy
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

The proxy server will start at `http://localhost:8080` by default.

## Configuration

Create a `config.json` file in the project root:

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
  },
  "logging": {
    "level": "info",
    "file": "proxy.log"
  },
  "userAgent": {
    "enabled": true,
    "rotate": true,
    "value": "CustomUserAgent/1.0",
    "presets": [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"
    ]
  }
}
```

## Usage

### Basic Proxy

1. Set your browser's proxy settings to the SubtractProxy address (default: `127.0.0.1:8080`)
2. Browse normally - all requests will be filtered through SubtractProxy

### With LLM Filtering

1. Start Ollama server (if using local LLM)
2. Configure LLM settings in config.json
3. Start SubtractProxy
4. Content will be automatically filtered based on LLM analysis

### User-Agent Management

SubtractProxy provides flexible User-Agent management:

1. **Custom User-Agent**
   - Set a specific User-Agent string using the `value` field
   ```json
   {
     "userAgent": {
       "enabled": true,
       "value": "CustomUserAgent/1.0"
     }
   }
   ```

2. **User-Agent Rotation**
   - Enable automatic rotation between preset User-Agents
   ```json
   {
     "userAgent": {
       "enabled": true,
       "rotate": true,
       "presets": [
         "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
       ]
     }
   }
   ```

3. **Disable User-Agent Modification**
   - Keep original request's User-Agent
   ```json
   {
     "userAgent": {
       "enabled": false
     }
   }
   ```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

GOROman

## Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM support
- [Express.js](https://expressjs.com/) for the web server framework
- [http-proxy](https://github.com/http-party/node-http-proxy) for proxy functionality
