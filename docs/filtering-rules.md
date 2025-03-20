# Content Filtering Rules

## Overview

SubtractProxy provides powerful content filtering capabilities using LLM (Large Language Model) technology. This document explains how to configure and use the filtering system effectively.

## Basic Configuration

### LLM Settings

```json
{
  "llm": {
    "enabled": true,
    "type": "ollama",
    "model": "gemma",
    "baseUrl": "http://localhost:11434",
    "rules": {
      "categories": ["nsfw", "spam", "malware"],
      "sensitivity": "medium",
      "customPatterns": []
    }
  }
}
```

## Filtering Categories

### 1. Built-in Categories

- **NSFW Content**
  - Adult content
  - Explicit material
  - Age-restricted content

- **Spam**
  - Unsolicited advertisements
  - Bulk messaging
  - Promotional content

- **Malware**
  - Suspicious scripts
  - Known malicious patterns
  - Security threats

### 2. Custom Categories

Create custom categories by adding patterns:

```json
{
  "llm": {
    "rules": {
      "customPatterns": [
        {
          "name": "company-confidential",
          "patterns": [
            "confidential",
            "internal-only",
            "proprietary"
          ],
          "action": "block"
        }
      ]
    }
  }
}
```

## Filtering Actions

### 1. Block
- Returns an error page
- Logs the blocked request
- Notifies the user

### 2. Allow
- Passes content through
- Optional logging
- No modification

### 3. Modify
- Transforms content
- Removes specific elements
- Preserves structure

### 4. Log
- Records without blocking
- Detailed logging
- Analysis purposes

## Advanced Configuration

### 1. Sensitivity Levels

```json
{
  "llm": {
    "rules": {
      "sensitivity": "high",
      "thresholds": {
        "nsfw": 0.8,
        "spam": 0.7,
        "malware": 0.9
      }
    }
  }
}
```

### 2. URL Patterns

```json
{
  "llm": {
    "rules": {
      "urlPatterns": {
        "whitelist": [
          "*.trusted-domain.com",
          "api.service.com/*"
        ],
        "blacklist": [
          "*.suspicious-site.com",
          "*/ads/*"
        ]
      }
    }
  }
}
```

## Best Practices

1. **Performance Optimization**
   - Use URL patterns for initial filtering
   - Configure appropriate thresholds
   - Enable caching when possible

2. **Security**
   - Regularly update block lists
   - Monitor false positives
   - Review logs periodically

3. **Maintenance**
   - Keep LLM models updated
   - Refine custom patterns
   - Adjust sensitivity levels

## Troubleshooting

### Common Issues

1. **False Positives**
   - Adjust sensitivity levels
   - Review custom patterns
   - Update whitelist

2. **Performance**
   - Check LLM server status
   - Optimize pattern matching
   - Review caching settings

3. **Configuration**
   - Validate JSON syntax
   - Check rule formatting
   - Verify pattern syntax
