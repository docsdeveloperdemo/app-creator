# Enhanced File System API Documentation

## Overview

This server now includes comprehensive file system operations with **intelligent protection mechanisms**, **project detection**, **template generation**, and **pattern-based command validation**. All file operations are secured against path traversal attacks and include automatic backup functionality for protected files.

## 🚀 **NEW FEATURES**

### Enhanced Security & Intelligence
- **Smart File Protection**: Pattern-based file analysis instead of rigid lists
- **Flexible Command Validation**: Supports any legitimate npm package via regex patterns
- **Project Type Detection**: Automatically detects React, Next.js, Express, Vue, Svelte projects
- **Smart Suggestions**: Recommends missing dependencies and improvements
- **Context-Aware Backups**: Enhanced backups with metadata and operation context

### Project Templates & Scaffolding
- **Ready-to-Use Templates**: React, Next.js, and Express project templates
- **Complete Project Generation**: Full project structure with configs and dependencies
- **Modern Stack**: TypeScript, Tailwind, best practices built-in

### New API Endpoints
- `GET /project/analyze` - Analyze current project type and get suggestions
- `GET /system/health` - System health check with protection status
- `GET /templates` - List available project templates
- `POST /templates/generate` - Generate project from template

## Enhanced Protection System

### Smart File Analysis
The system now uses **pattern-based protection** instead of hardcoded lists:

```javascript
// Allowed project development paths
/^src\//                    // Source files
/^components\//             // React/UI components  
/^pages\//                  // Next.js pages
/^app\//                    // Next.js app directory
/^lib\//                    // Utility libraries
/^styles\//                 // CSS/styling files
/^config\//                 // Configuration files
/\.(md|txt|json)$/i         // Documentation and config files
/^tailwind\.config\.(js|ts)$/ // Framework configs
```

### Critical System Files (Never Modified)
- `keyboard_server.js` - Core server file
- `server.js` - Alternative server file

### Protected Directories (Blocked Access)
- `keyboard_utils/` - System utilities
- `.file-backups/` - Backup storage
- `.git/` - Git system files
- `.devcontainer/` - Codespace configuration

## 🔧 Enhanced API Endpoints

### 1. Project Analysis
**Endpoint:** `GET /project/analyze`

Analyzes the current project and provides intelligent suggestions.

```bash
curl -X GET http://localhost:3001/project/analyze
```

**Response:**
```json
{
  "projectType": "nextjs",
  "packageManager": "npm", 
  "features": ["typescript", "tailwind", "auth"],
  "suggestions": [
    {
      "type": "dependency",
      "package": "prisma",
      "reason": "Add database ORM for data management",
      "command": "npm install prisma @prisma/client",
      "priority": "medium"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "structure": {
    "src": true,
    "app": true,
    "components": true,
    "package.json": true,
    "tsconfig.json": true
  }
}
```

### 2. System Health Check
**Endpoint:** `GET /system/health`

Monitors system integrity and protection status.

```bash
curl -X GET http://localhost:3001/system/health
```

**Response:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": "healthy",
  "criticalFiles": [
    {
      "file": "keyboard_server.js",
      "exists": true,
      "size": 15420
    }
  ],
  "protectedDirs": [
    {
      "directory": "keyboard_utils/",
      "exists": true
    }
  ],
  "backupSystem": {
    "backupDir": ".file-backups",
    "exists": true,
    "backupCount": 5
  }
}
```

### 3. Template Management
**Endpoint:** `GET /templates`

Lists available project templates.

```bash
curl -X GET http://localhost:3001/templates
```

**Response:**
```json
{
  "templates": [
    {
      "id": "react",
      "name": "React Application", 
      "description": "Modern React app with Vite and TypeScript support"
    },
    {
      "id": "nextjs",
      "name": "Next.js Application",
      "description": "Modern Next.js app with App Router and TypeScript"
    },
    {
      "id": "express", 
      "name": "Express API",
      "description": "RESTful API with Express.js and TypeScript"
    }
  ]
}
```

### 4. Project Generation
**Endpoint:** `POST /templates/generate`

Generates a complete project from a template.

```bash
curl -X POST http://localhost:3001/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "react",
    "projectName": "my-awesome-app"
  }'
```

**Response:**
```json
{
  "success": true,
  "templateId": "react",
  "projectName": "my-awesome-app", 
  "filesCreated": 12,
  "directoriesCreated": 8,
  "files": [
    {
      "type": "directory",
      "path": "my-awesome-app/src"
    },
    {
      "type": "file", 
      "path": "my-awesome-app/src/App.tsx",
      "size": 1240
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Enhanced Command Validation

### Pattern-Based Validation
The system now uses **flexible regex patterns** instead of hardcoded command lists:

```javascript
// ✅ These patterns are now supported:
/^npm\s+(install|i|add|remove)\s+.*/     // Any npm package install
/^npx\s+create-[\w@/-]+(\s+.*)?$/        // Any create command
/^yarn\s+[\w:-]+(\s+.*)?$/               // Any yarn script
/^npm\s+run\s+[\w:-]+(\s+.*)?$/          // Any npm script
```

### Supported Commands
- **Package Management**: `npm install any-package`, `yarn add @types/node`, `pnpm i -D typescript`
- **Project Generators**: `npx create-react-app`, `npx create-next-app@latest`, `npm create vite@latest`
- **Development Tools**: `npx prettier --write .`, `npx eslint src/`, `npx tsc --noEmit`
- **Build Commands**: `npm run build`, `yarn dev`, `pnpm start`
- **Git Operations**: `git add .`, `git commit -m "message"`, `git push origin main`

### Blocked Patterns (Security)
```javascript
/rm\s+-rf/              // Dangerous deletions
/sudo/                  // Elevated privileges  
/keyboard_server\.js/   // Touching system files
/eval\s*\(/            // Code evaluation
/>\s*\/etc\//          // Writing to system directories
```

## Enhanced Backup System

### Smart Backups with Context
Backups now include **context and metadata**:

```bash
# Backup filename format
filename.context.timestamp.backup

# Examples
package.json.update.2024-01-01T12-00-00-000Z.backup
App.tsx.create-overwrite.2024-01-01T12-00-00-000Z.backup
```

### Backup Metadata
Each backup includes a `.meta` file:
```json
{
  "originalPath": "src/App.tsx",
  "context": "update",
  "timestamp": "2024-01-01T12-00-00-000Z", 
  "size": 1240,
  "protection": {
    "allowed": true,
    "level": "PROJECT_FILE",
    "reason": "Allowed project development file"
  },
  "hash": "a1b2c3d4e5f6..."
}
```

## Project Templates

### React Template
**Features**: Vite, TypeScript, Tailwind CSS, ESLint, modern project structure

**Generated Structure**:
```
my-react-app/
├── src/
│   ├── components/ui/
│   ├── lib/utils.ts
│   ├── types/index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Next.js Template  
**Features**: App Router, TypeScript, Tailwind CSS, shadcn/ui components

**Generated Structure**:
```
my-nextjs-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/hello/route.ts
├── components/ui/button.tsx
├── lib/utils.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

### Express Template
**Features**: TypeScript, structured architecture, CORS, security middleware

**Generated Structure**:
```
my-express-api/
├── src/
│   ├── controllers/index.ts
│   ├── middleware/auth.ts
│   ├── routes/index.ts
│   ├── types/index.ts
│   ├── utils/logger.ts
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Usage Examples

### Generate a React Project
```javascript
const response = await fetch('http://localhost:3001/templates/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'react',
    projectName: 'my-portfolio'
  })
});

const result = await response.json();
console.log(`Created ${result.filesCreated} files in ${result.projectName}`);
```

### Analyze Current Project
```javascript
const analysis = await fetch('http://localhost:3001/project/analyze');
const project = await analysis.json();

console.log(`Project Type: ${project.projectType}`);
console.log(`Features: ${project.features.join(', ')}`);
console.log(`Suggestions: ${project.suggestions.length} recommendations`);
```

### Check System Health
```javascript
const health = await fetch('http://localhost:3001/system/health');
const status = await health.json();

console.log(`System Status: ${status.status}`);
console.log(`Backups Available: ${status.backupSystem.backupCount}`);
```

## Migration Guide

### From Old System
The enhanced system is **fully backward compatible**. Your existing MCP tools continue to work unchanged, but now benefit from:

1. **Enhanced Security**: Smarter file protection without breaking existing workflows
2. **Flexible Commands**: Support for any legitimate npm package instead of hardcoded lists  
3. **Better Backups**: Enhanced backup system with context and metadata
4. **Project Intelligence**: Automatic project detection and suggestions

### New Capabilities
You can now:
- Install **any npm package**: `npm install @clerk/nextjs`, `yarn add framer-motion`
- Use **any project generator**: `npx create-t3-app`, `npm create astro@latest`
- Generate **complete projects** from templates in seconds
- Get **intelligent suggestions** for your current project
- Monitor **system health** and backup status

## Security Enhancements

### Smart Protection Levels
1. **CRITICAL**: System files (never modified) - `keyboard_server.js`
2. **SYSTEM_DIRECTORY**: Protected directories - `keyboard_utils/`, `.git/`
3. **PROJECT_FILE**: Allowed development files - `src/`, `components/`
4. **SYSTEM_FILE**: Other files (cautious approval with backup)

### Pattern-Based Security
- **Whitelist Approach**: Only allow patterns that match safe operations
- **Blacklist Protection**: Block dangerous patterns like `rm -rf`, `sudo`
- **Context Validation**: Different rules for different file types and locations

### Backup Strategy
- **Automatic**: Protected files always backed up
- **Smart**: Context-aware backup naming
- **Retention**: Maximum 10 backups per file
- **Metadata**: Full operation context preserved

## Best Practices

### For AI Development
1. **Use Templates**: Start with `POST /templates/generate` for new projects
2. **Check Analysis**: Use `GET /project/analyze` to understand existing projects  
3. **Install Packages**: Use pattern-based commands `npm install any-package`
4. **Monitor Health**: Check `GET /system/health` for system status

### For Project Structure
1. **Follow Patterns**: Use allowed paths like `src/`, `components/`, `lib/`
2. **Respect Protection**: Don't attempt to modify `keyboard_server.js`
3. **Use Backups**: Enhanced backup system protects your work
4. **Leverage Intelligence**: Let the system suggest improvements

### For Security
1. **Trust the Patterns**: Regex-based validation is more flexible than hardcoded lists
2. **Monitor Backups**: Check `.file-backups/` directory periodically
3. **Follow Suggestions**: System recommendations improve project quality
4. **Report Issues**: System health endpoint helps diagnose problems

## Error Handling

### Enhanced Error Messages
```json
{
  "error": "create operation blocked: File in protected system directory: keyboard_utils/",
  "type": "FileOperationError"
}
```

### Command Validation Errors
```json
{
  "error": "Command blocked for security: rm -rf node_modules",
  "type": "CommandValidationError"  
}
```

### Template Generation Errors
```json
{
  "error": "Invalid template ID: invalid-template",
  "type": "TemplateError"
}
```

## Conclusion

The enhanced app-creator system transforms your development environment into an **intelligent, secure, and flexible** platform for AI-driven development. With pattern-based security, project intelligence, and comprehensive templates, you can build modern applications faster while maintaining bulletproof protection for critical system files.

The system grows with you - supporting new frameworks, packages, and tools through intelligent pattern matching rather than rigid configuration. Welcome to the future of AI-assisted development! 🚀 