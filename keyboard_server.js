const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { retrievePackageJson, retrieveEnvironmentVariableKeys, retrieveDocResources } = require('./keyboard_utils/retrieve_resources/keybooard_resources');
const { PROJECT_TEMPLATES } = require('./project-templates');
const { browserOperations, handleBrowserOperation } = require('./keyboard_utils/browser_automation');

// Enhanced File protection and backup utilities with intelligent pattern matching

// Enhanced Configuration constants
const FILE_PROTECTION_CONFIG = {
    backupDir: path.join(process.cwd(), '.file-backups'),
    
    // Core system files that should NEVER be modified
    criticalSystemFiles: [
        'keyboard_server.js',
        'server.js'
    ],
    
    // Protected files with backup requirement
    protectedFiles: [
        'keyboard_server.js',
        'server.js', 
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
        '.gitignore'
    ],
    
    // Protected directories
    protectedDirectories: [
        'keyboard_utils/',
        'keyboard_utils/retrieve_resources/',
        '.file-backups/',
        '.git/',
        '.devcontainer/'
    ],
    
    // Allow project development in these paths
    allowedProjectPaths: [
        /^src\//,
        /^public\//,
        /^pages\//,
        /^app\//,
        /^components\//,
        /^styles\//,
        /^lib\//,
        /^utils\/(?!keyboard)/,  // utils/ but not keyboard_utils/
        /^hooks\//,
        /^types\//,
        /^__tests__\//,
        /^docs\//,
        /^config\//,
        /^middleware\//,
        /^models\//,
        /^routes\//,
        /^services\//,
        /^controllers\//,
        /\.(md|txt|json)$/i,
        /^tailwind\.config\.(js|ts)$/,
        /^next\.config\.(js|ts)$/,
        /^tsconfig\.json$/,
        /^postcss\.config\.(js|ts)$/,
        /^vite\.config\.(js|ts)$/,
        /^webpack\.config\.(js|ts)$/,
        /^babel\.config\.(js|json)$/,
        /^\.eslintrc\.(js|json)$/,
        /^\.prettierrc(\.(js|json))?$/,
        /^jest\.config\.(js|ts)$/,
        /^vitest\.config\.(js|ts)$/
    ],

    credentialFiles: [
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
        '.env.test',
        '.env.staging',
        'credentials.json',
        'secrets.json',
        'config.json',
        'private.key',
        'id_rsa',
        'id_ed25519',
        '.ssh',
        '.aws',
        '.gcp'
    ],
    credentialPatterns: [
        /\.env(\.|$)/i,
        /credential/i,
        /secret/i,
        /password/i,
        /token/i,
        /key$/i,
        /\.pem$/i,
        /\.p12$/i,
        /\.pfx$/i,
        /wallet\./i,
        /keystore/i
    ],
    maxBackups: 10,
    maxFileSize: 10 * 1024 * 1024 // 10MB
};

// Smart File Analysis
const analyzeFilePath = (filePath) => {
    const normalizedPath = path.normalize(filePath);
    const fileName = path.basename(filePath);
    
    // Critical system files - never allow modification
    if (FILE_PROTECTION_CONFIG.criticalSystemFiles.includes(fileName)) {
        return {
            allowed: false,
            level: 'CRITICAL',
            reason: 'Critical system file cannot be modified'
        };
    }
    
    // Check if it's in allowed project paths
    const isAllowedProject = FILE_PROTECTION_CONFIG.allowedProjectPaths.some(pattern =>
        pattern.test(normalizedPath)
    );
    
    if (isAllowedProject) {
        return {
            allowed: true,
            level: 'PROJECT_FILE',
            reason: 'Allowed project development file'
        };
    }
    
    // Check protected directories
    for (const protectedDir of FILE_PROTECTION_CONFIG.protectedDirectories) {
        if (normalizedPath.startsWith(protectedDir)) {
            return {
                allowed: false,
                level: 'SYSTEM_DIRECTORY',
                reason: `File in protected system directory: ${protectedDir}`
            };
        }
    }
    
    // Default to cautious approval for other files
    return {
        allowed: true,
        level: 'SYSTEM_FILE',
        reason: 'System file - requires careful handling'
    };
};

// Enhanced Utility functions
const ensureBackupDirectory = () => {
    if (!fs.existsSync(FILE_PROTECTION_CONFIG.backupDir)) {
        fs.mkdirSync(FILE_PROTECTION_CONFIG.backupDir, { recursive: true });
    }
};

const isProtectedFile = (filePath) => {
    const fileName = path.basename(filePath);
    return FILE_PROTECTION_CONFIG.protectedFiles.includes(fileName);
};

const isCriticalFile = (filePath) => {
    const fileName = path.basename(filePath);
    return FILE_PROTECTION_CONFIG.criticalSystemFiles.includes(fileName);
};

const validateFileOperation = (filePath, operation = 'read') => {
    const analysis = analyzeFilePath(filePath);
    
    if (!analysis.allowed) {
        throw new Error(`${operation} operation blocked: ${analysis.reason}`);
    }
    
    // Extra protection for critical files
    if (analysis.level === 'CRITICAL') {
        throw new Error(`Critical system file cannot be modified: ${path.basename(filePath)}`);
    }
    
    return analysis;
};

const isCredentialFile = (filePath) => {
    const fileName = path.basename(filePath);
    const fullPath = path.resolve(filePath);
    
    // Check against known credential file names
    if (FILE_PROTECTION_CONFIG.credentialFiles.includes(fileName)) {
        return true;
    }
    
    // Check against credential patterns
    return FILE_PROTECTION_CONFIG.credentialPatterns.some(pattern => pattern.test(fileName));
};

const validateCredentialAccess = (filePath, operation = 'read') => {
    if (isCredentialFile(filePath)) {
        throw new Error(`Access denied: Cannot ${operation} credential file '${path.basename(filePath)}' for security reasons`);
    }
};

const validateFilePath = (filePath) => {
    // Prevent path traversal attacks
    const normalizedPath = path.normalize(filePath);
    const cwd = process.cwd();
    const fullPath = path.resolve(cwd, normalizedPath);
    
    if (!fullPath.startsWith(cwd)) {
        throw new Error('Path traversal not allowed');
    }
    
    return fullPath;
};

const validateFileSize = (filePath, maxSize = FILE_PROTECTION_CONFIG.maxFileSize) => {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
        throw new Error(`File size ${stats.size} exceeds maximum allowed size ${maxSize}`);
    }
};

const cleanupOldBackups = async (fileName) => {
    try {
        const backupPattern = new RegExp(`^${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\..*\\.backup$`);
        const backupFiles = fs.readdirSync(FILE_PROTECTION_CONFIG.backupDir)
            .filter(file => backupPattern.test(file))
            .map(file => ({
                name: file,
                path: path.join(FILE_PROTECTION_CONFIG.backupDir, file),
                stat: fs.statSync(path.join(FILE_PROTECTION_CONFIG.backupDir, file))
            }))
            .sort((a, b) => b.stat.mtime - a.stat.mtime);

        // Keep only the most recent backups
        if (backupFiles.length > FILE_PROTECTION_CONFIG.maxBackups) {
            const filesToDelete = backupFiles.slice(FILE_PROTECTION_CONFIG.maxBackups);
            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`🗑️ Removed old backup: ${file.name}`);
            }
        }
    } catch (error) {
        console.error(`❌ Failed to cleanup old backups:`, error.message);
    }
};

const createSmartBackup = async (filePath, context = 'update') => {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }

        ensureBackupDirectory();

        const fileName = path.basename(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `${fileName}.${context}.${timestamp}.backup`;
        const backupPath = path.join(FILE_PROTECTION_CONFIG.backupDir, backupFileName);

        // Copy file to backup location
        fs.copyFileSync(filePath, backupPath);

        // Create metadata
        const metadata = {
            originalPath: filePath,
            context: context,
            timestamp: timestamp,
            size: fs.statSync(filePath).size,
            protection: analyzeFilePath(filePath),
            hash: require('crypto').createHash('md5').update(fs.readFileSync(filePath)).digest('hex')
        };

        fs.writeFileSync(`${backupPath}.meta`, JSON.stringify(metadata, null, 2));

        // Clean up old backups
        await cleanupOldBackups(fileName);

        console.log(`📦 Smart backup created: ${backupFileName} (${context})`);
        return backupPath;
    } catch (error) {
        console.error(`❌ Failed to create backup for ${filePath}:`, error.message);
        throw error;
    }
};

// Legacy function for backward compatibility
const createBackup = async (filePath) => {
    return createSmartBackup(filePath, 'legacy');
};

// Bulk operation utilities - ENHANCED WITH PARALLEL PROCESSING
const processBulkOperation = async (files, operation) => {
    if (!Array.isArray(files)) {
        // Single file operation
        return await operation(files);
    }
    
    // ✨ PARALLEL BULK OPERATION USING Promise.all ✨
    console.log(`🚀 Starting parallel processing of ${files.length} files...`);
    const startTime = Date.now();
    
    // Create promises for all file operations to run in parallel
    const promises = files.map(async (file, index) => {
        try {
            const result = await operation(file);
            return {
                index,
                file,
                success: true,
                result
            };
        } catch (error) {
            return {
                index,
                file,
                success: false,
                error: error.message,
                type: error.constructor.name
            };
        }
    });
    
    // Execute all operations in parallel
    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;
    
    // Separate successful and failed operations
    const successes = results.filter(r => r.success);
    const errors = results.filter(r => !r.success);
    
    console.log(`⚡ Parallel processing completed in ${elapsed}ms: ${successes.length} success, ${errors.length} errors`);
    
    return {
        success: errors.length === 0,
        totalFiles: files.length,
        successCount: successes.length,
        errorCount: errors.length,
        executionTime: elapsed,
        results: successes,
        errors: errors
    };
};

const validateBulkPayload = (payload, requiredFields) => {
    if (payload.files) {
        // Bulk operation
        if (!Array.isArray(payload.files)) {
            throw new Error('files must be an array for bulk operations');
        }
        
        if (payload.files.length === 0) {
            throw new Error('files array cannot be empty');
        }
        
        if (payload.files.length > 50) {
            throw new Error('Maximum 50 files allowed per bulk operation');
        }
        
        // Validate each file object has required fields
        payload.files.forEach((file, index) => {
            requiredFields.forEach(field => {
                if (file[field] === undefined) {
                    throw new Error(`files[${index}].${field} is required`);
                }
            });
        });
        
        return true; // Is bulk operation
    } else {
        // Single file operation
        requiredFields.forEach(field => {
            if (payload[field] === undefined) {
                throw new Error(`${field} is required`);
            }
        });
        
        return false; // Is single file operation
    }
};

// Initialize backup directory
ensureBackupDirectory();

// Enhanced Pattern-Based Command Validation System
const SAFE_COMMAND_PATTERNS = {
    // Package management
    npm: [
        /^npm\s+(install|i|add|remove|uninstall|update|outdated|audit|fund)(\s+.*)?$/,
        /^npm\s+run\s+[\w:-]+(\s+.*)?$/,
        /^npm\s+(start|build|test|dev|lint|preview|serve)(\s+.*)?$/,
        /^npm\s+ci(\s+.*)?$/
    ],
    
    yarn: [
        /^yarn\s+(add|remove|install|upgrade|outdated|audit)(\s+.*)?$/,
        /^yarn\s+[\w:-]+(\s+.*)?$/,
        /^yarn\s+(start|build|test|dev|lint|preview|serve)(\s+.*)?$/,
        /^yarn(\s+install)?$/
    ],
    
    pnpm: [
        /^pnpm\s+(add|remove|install|update|outdated|audit)(\s+.*)?$/,
        /^pnpm\s+[\w:-]+(\s+.*)?$/,
        /^pnpm\s+(start|build|test|dev|lint|preview|serve)(\s+.*)?$/,
        /^pnpm\s+i(\s+.*)?$/
    ],
    
    // Project generators - allow any create command
    generators: [
        /^npx\s+create-[\w@/-]+(@[\w.-]+)?(\s+.*)?$/,
        /^npm\s+create\s+[\w@/-]+(\s+.*)?$/,
        /^yarn\s+create\s+[\w@/-]+(\s+.*)?$/,
        /^pnpm\s+create\s+[\w@/-]+(\s+.*)?$/
    ],
    
    // Development tools
    tools: [
        /^npx\s+[\w@/-]+(\s+[\w@/.=:-]*)*$/,
        /^node\s+[\w./-]+\.js(\s+.*)?$/,
        /^npx\s+(next|vite|react-scripts|storybook)\s+[\w-]+(\s+.*)?$/
    ],
    
    // Safe file operations - ENHANCED WITH MORE CAT OPERATIONS
    fileOps: [
        /^ls(\s+-[la]+)?(\s+.*)?$/,
        /^cat\s+[\w.\/-]+(\.(js|ts|tsx|jsx|json|md|txt|css|scss|sass|less|html|xml|yml|yaml|toml|env))?$/,
        /^cat\s+[\w.\/-]+\s*\|\s*head(\s+-n\s+\d+)?.*$/,
        /^cat\s+[\w.\/-]+\s*\|\s*tail(\s+-n\s+\d+)?.*$/,
        /^cat\s+[\w.\/-]+\s*\|\s*grep\s+[\w.\-]+.*$/,
        /^head\s+(-n\s+\d+\s+)?[\w.\/-]+$/,
        /^tail\s+(-n\s+\d+\s+)?[\w.\/-]+$/,
        /^tail\s+-f\s+[\w.\/-]+$/,
        /^grep\s+(-[ilnr]+\s+)?[\w.\-]+\s+[\w.\/-]+$/,
        /^find\s+[\w.\/-]+\s+-name\s+[\w.*\-"']+$/,
        /^find\s+[\w.\/-]+\s+-name\s+[\w.*\-"']+\s*\|\s*head(\s+-n?\s*\d+)?.*$/,
        /^find\s+[\w.\/-]+\s+-name\s+[\w.*\-"']+\s*\|\s*tail(\s+-n?\s*\d+)?.*$/,
        /^find\s+[\w.\/-]+\s+-name\s+[\w.*\-"']+\s*\|\s*grep\s+[\w.\-]+.*$/,
        /^wc\s+(-[lwc]+\s+)?[\w.\/-]+$/,
        /^file\s+[\w.\/-]+$/,
        /^stat\s+[\w.\/-]+$/,
        /^mkdir\s+-p\s+[\w.\/-]+$/,
        /^cd\s+[\w.\/-]+$/,
        /^pwd$/,
        /^echo\s+[\w\s"'.\-]+$/,
        /^which\s+[\w\-]+$/,
        /^tree(\s+-[aL]+)?(\s+[\w.\/-]+)?$/
    ],
    
    // Command chaining patterns
    chaining: [
        /^cd\s+[\w.\/-]+\s+&&\s+npm\s+(install|i|add|remove|uninstall|update|outdated|audit|fund)(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+npm\s+run\s+[\w:\-]+(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+npm\s+(start|build|test|dev|lint|preview|serve)(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+npm\s+ci(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+yarn\s+(add|remove|install|upgrade|outdated|audit)(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+yarn\s+[\w:\-]+(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+yarn\s+(start|build|test|dev|lint|preview|serve)(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+yarn(\s+install)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+pnpm\s+(add|remove|install|upgrade|outdated|audit)(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+pnpm\s+[\w:\-]+(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+pnpm\s+(start|build|test|dev|lint|preview|serve)(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+pnpm\s+i(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+ls(\s+-[la]+)?(\s+.*)?$/,
        /^cd\s+[\w.\/-]+\s+&&\s+pwd$/,
        /^cd\s+[\w.\/-]+\s+&&\s+cat\s+[\w.\/-]+$/,
        /^cd\s+[\w.\/-]+\s+&&\s+tree(\s+-[aL]+)?(\s+[\w.\/-]+)?$/
    ],

    // Git operations (safe ones)
    git: [
        /^git\s+(status|log|diff|show)(\s+.*)?$/,
        /^git\s+(add|commit|push|pull)\s+.*$/,
        /^git\s+(checkout|branch)\s+[\w/-]+$/,
        /^git\s+clone\s+https:\/\/.*$/
    ]
};

const BLOCKED_PATTERNS = [
    /rm\s+-rf/,                    // Dangerous deletions
    /sudo/,                        // Elevated privileges
    /chmod\s+[0-7]+/,             // Permission changes
    /chown/,                       // Ownership changes
    /curl.*\|\s*sh/,              // Piping to shell
    /wget.*\|\s*sh/,              // Piping to shell
    /keyboard_server\.js/,         // Touching keyboard server
    /keyboard_utils/,              // Touching keyboard utilities
    />\s*\/etc\//,                // Writing to system directories
    /\/bin\/(?!sh)/,              // Direct binary execution
    /\/usr\/bin\//,               // System binaries
    /eval\s*\(/,                  // Code evaluation
    /exec\s*\(/,                  // Code execution
    /spawn\s*\(/,                 // Process spawning
    /\.\.\/\.\.\//                // Directory traversal
];

const validateCommand = (command) => {
    const cmd = command.trim();
    
    // Block dangerous patterns first
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(cmd)) {
            throw new Error(`Command blocked for security: ${cmd}`);
        }
    }
    
    // Check if command matches safe patterns
    const allPatterns = Object.values(SAFE_COMMAND_PATTERNS).flat();
    const isAllowed = allPatterns.some(pattern => pattern.test(cmd));
    
    if (isAllowed) {
        return { allowed: true, safe: true };
    }
    
    throw new Error(`Command not in safe patterns: ${cmd}`);
};

// Intelligent Project Detection System
const detectProjectType = () => {
    let projectType = 'unknown';
    let packageManager = 'npm';
    let features = [];
    
    // Detect package manager
    if (fs.existsSync('yarn.lock')) packageManager = 'yarn';
    else if (fs.existsSync('pnpm-lock.yaml')) packageManager = 'pnpm';
    
    // Read package.json to determine framework
    if (fs.existsSync('package.json')) {
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            
            // Framework detection
            if (deps.next) {
                projectType = 'nextjs';
                if (deps['@trpc/server']) features.push('trpc');
                if (deps['next-auth']) features.push('auth');
                if (deps['@next/font']) features.push('font-optimization');
            } else if (deps.react) {
                projectType = 'react';
                if (deps['react-router-dom']) features.push('routing');
                if (deps.vite) features.push('vite');
            } else if (deps.express) {
                projectType = 'express';
                if (deps.prisma) features.push('database');
                if (deps.cors) features.push('cors');
            } else if (deps.vue) {
                projectType = 'vue';
                if (deps.nuxt) features.push('nuxt');
            } else if (deps.svelte) {
                projectType = 'svelte';
                if (deps['@sveltejs/kit']) features.push('sveltekit');
            }
            
            // Common features
            if (deps.typescript) features.push('typescript');
            if (deps.tailwindcss) features.push('tailwind');
            if (deps.prisma) features.push('prisma');
            if (deps.eslint) features.push('linting');
            if (deps.prettier) features.push('formatting');
            if (deps.jest || deps.vitest) features.push('testing');
            if (deps['@storybook/react']) features.push('storybook');
            if (deps.framer-motion) features.push('animations');
            
        } catch (error) {
            console.warn('Could not parse package.json:', error.message);
        }
    }
    
    return { projectType, packageManager, features };
};

const getProjectSuggestions = (projectInfo) => {
    const suggestions = [];
    const { projectType, features } = projectInfo;
    
    if (projectType === 'react' && !features.includes('routing')) {
        suggestions.push({
            type: 'dependency',
            package: 'react-router-dom',
            reason: 'Add client-side routing to React app',
            command: 'npm install react-router-dom',
            priority: 'medium'
        });
    }
    
    if (projectType === 'nextjs' && !features.includes('auth')) {
        suggestions.push({
            type: 'dependency',
            package: 'next-auth',
            reason: 'Add authentication to Next.js app',
            command: 'npm install next-auth',
            priority: 'medium'
        });
    }
    
    if (!features.includes('tailwind') && (projectType === 'react' || projectType === 'nextjs')) {
        suggestions.push({
            type: 'dependency',
            package: 'tailwindcss',
            reason: 'Add Tailwind CSS for styling',
            command: 'npm install -D tailwindcss postcss autoprefixer',
            priority: 'high'
        });
    }
    
    if (!features.includes('typescript') && (projectType !== 'unknown')) {
        suggestions.push({
            type: 'dependency',
            package: 'typescript',
            reason: 'Add TypeScript for type safety',
            command: 'npm install -D typescript @types/node',
            priority: 'medium'
        });
    }
    
    if (!features.includes('linting') && (projectType !== 'unknown')) {
        suggestions.push({
            type: 'dependency',
            package: 'eslint',
            reason: 'Add ESLint for code quality',
            command: 'npm install -D eslint',
            priority: 'low'
        });
    }
    
    if (projectType === 'express' && !features.includes('cors')) {
        suggestions.push({
            type: 'dependency',
            package: 'cors',
            reason: 'Add CORS support for API',
            command: 'npm install cors',
            priority: 'high'
        });
    }
    
    return suggestions;
};

const scanProjectStructure = () => {
    const structure = {};
    
    // Check for common directories
    const commonDirs = ['src', 'public', 'pages', 'app', 'components', 'lib', 'utils', 'styles'];
    commonDirs.forEach(dir => {
        structure[dir] = fs.existsSync(dir);
    });
    
    // Check for important files
    const importantFiles = [
        'package.json', 'tsconfig.json', 'next.config.js', 'next.config.ts', 
        'tailwind.config.js', 'vite.config.js', '.eslintrc.js', '.prettierrc'
    ];
    importantFiles.forEach(file => {
        structure[file] = fs.existsSync(file);
    });
    
    return structure;
};

// File system utilities
async function handleFileOperation(req, res, operation) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const payload = JSON.parse(body);
            const result = await operation(payload);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            console.error(`❌ File operation error:`, error.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: error.message,
                type: error.constructor.name 
            }));
        }
    });
}

// File operation handlers
const fileOperations = {
    async create(payload) {
        const isBulk = validateBulkPayload(payload, ['filePath', 'content']);
        
        if (isBulk) {
            // Bulk operation
            return await processBulkOperation(payload.files, async (fileData) => {
                const singleResult = await fileOperations.create({
                    ...fileData,
                    overwrite: payload.overwrite
                });
                return singleResult;
            });
        }
        
        // Single file operation
        const { filePath, content, overwrite = false } = payload;
        
        // Enhanced validation with smart file analysis
        const analysis = validateFileOperation(filePath, 'create');
        validateCredentialAccess(filePath, 'create');
        
        const fullPath = validateFilePath(filePath);
        
        // Check if file exists and overwrite is not allowed
        if (fs.existsSync(fullPath) && !overwrite) {
            throw new Error(`File ${filePath} already exists. Set overwrite=true to replace.`);
        }
        
        // Create smart backup if file exists and needs protection
        let backupPath = null;
        if (fs.existsSync(fullPath)) {
            if (isProtectedFile(fullPath) || analysis.level === 'SYSTEM_FILE') {
                backupPath = await createSmartBackup(fullPath, 'create-overwrite');
            }
        }
        
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(fullPath, content, 'utf8');
        
        console.log(`📄 Created/Updated file: ${filePath}`);
        
        return {
            success: true,
            filePath: filePath,
            fullPath: fullPath,
            size: content.length,
            backup: backupPath,
            protected: isProtectedFile(fullPath),
            timestamp: new Date().toISOString()
        };
    },

    async update(payload) {
        const isBulk = validateBulkPayload(payload, ['filePath', 'content']);
        
        if (isBulk) {
            // Bulk operation
            return await processBulkOperation(payload.files, async (fileData) => {
                const singleResult = await fileOperations.update({
                    ...fileData,
                    createBackup: payload.createBackup
                });
                return singleResult;
            });
        }
        
        // Single file operation
        const { filePath, content, createBackup: shouldCreateBackup = true } = payload;
        
        // Enhanced validation with smart file analysis
        const analysis = validateFileOperation(filePath, 'update');
        validateCredentialAccess(filePath, 'update');
        
        const fullPath = validateFilePath(filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File ${filePath} does not exist. Use create operation instead.`);
        }
        
        // Create smart backup if requested or file needs protection
        let backupPath = null;
        if (shouldCreateBackup || isProtectedFile(fullPath) || analysis.level === 'SYSTEM_FILE') {
            backupPath = await createSmartBackup(fullPath, 'update');
        }
        
        // Write updated content
        fs.writeFileSync(fullPath, content, 'utf8');
        
        console.log(`✏️ Updated file: ${filePath}`);
        
        return {
            success: true,
            filePath: filePath,
            fullPath: fullPath,
            size: content.length,
            backup: backupPath,
            protected: isProtectedFile(fullPath),
            timestamp: new Date().toISOString()
        };
    },

    async delete(payload) {
        const { filePath, force = false } = payload;
        
        if (!filePath) {
            throw new Error('filePath is required');
        }
        
        const fullPath = validateFilePath(filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File ${filePath} does not exist`);
        }
        
        // Prevent deletion of protected files unless forced
        if (isProtectedFile(fullPath) && !force) {
            throw new Error(`File ${filePath} is protected. Set force=true to delete.`);
        }
        
        // Create backup before deletion
        const backupPath = await createBackup(fullPath);
        
        // Delete file
        fs.unlinkSync(fullPath);
        
        console.log(`🗑️ Deleted file: ${filePath}`);
        
        return {
            success: true,
            filePath: filePath,
            fullPath: fullPath,
            backup: backupPath,
            protected: isProtectedFile(fullPath),
            timestamp: new Date().toISOString()
        };
    },

    async read(payload) {
        const isBulk = validateBulkPayload(payload, ['filePath']);
        
        if (isBulk) {
            // Bulk operation
            return await processBulkOperation(payload.files, async (fileData) => {
                const singleResult = await fileOperations.read({
                    ...fileData,
                    encoding: payload.encoding
                });
                return singleResult;
            });
        }
        
        // Single file operation
        const { filePath, encoding = 'utf8' } = payload;
        
        // Validate credential access
        validateCredentialAccess(filePath, 'read');
        
        const fullPath = validateFilePath(filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File ${filePath} does not exist`);
        }
        
        // Validate file size
        validateFileSize(fullPath);
        
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, encoding);
        
        console.log(`📖 Read file: ${filePath}`);
        
        return {
            success: true,
            filePath: filePath,
            fullPath: fullPath,
            content: content,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            protected: isProtectedFile(fullPath),
            credential: isCredentialFile(fullPath)
        };
    },

    async list(payload) {
        const { dirPath = '.', includeHidden = false, recursive = false, includeCredentials = false } = payload;
        
        const fullPath = validateFilePath(dirPath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Directory ${dirPath} does not exist`);
        }
        
        if (!fs.statSync(fullPath).isDirectory()) {
            throw new Error(`${dirPath} is not a directory`);
        }
        
        function getFileList(currentPath, relativePath = '') {
            const items = [];
            const entries = fs.readdirSync(currentPath);
            
            for (const entry of entries) {
                if (!includeHidden && entry.startsWith('.')) {
                    continue;
                }
                
                const entryPath = path.join(currentPath, entry);
                const relativeEntryPath = path.join(relativePath, entry);
                const stats = fs.statSync(entryPath);
                
                const item = {
                    name: entry,
                    path: relativeEntryPath,
                    fullPath: entryPath,
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile(),
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    protected: isProtectedFile(entryPath),
                    credential: isCredentialFile(entryPath)
                };
                
                // Filter out credential files unless explicitly requested
                if (!includeCredentials && item.credential && item.isFile) {
                    continue;
                }
                
                items.push(item);
                
                if (recursive && stats.isDirectory()) {
                    const subItems = getFileList(entryPath, relativeEntryPath);
                    items.push(...subItems);
                }
            }
            
            return items;
        }
        
        const files = getFileList(fullPath);
        
        console.log(`📁 Listed directory: ${dirPath} (${files.length} items)`);
        
        return {
            success: true,
            dirPath: dirPath,
            fullPath: fullPath,
            items: files,
            count: files.length,
            includeHidden: includeHidden,
            recursive: recursive,
            includeCredentials: includeCredentials,
            credentialFilesFiltered: !includeCredentials
        };
    }
};

// Local LLM integration
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hello World - File Protected Server');
        }
    } else if(req.method === 'POST' && req.url === '/fetch_key_name_and_resources') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const packageJson = await retrievePackageJson();
                const environmentVariableKeys = await retrieveEnvironmentVariableKeys();
                const docResources = await retrieveDocResources();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    "packageJson": packageJson,
                    "environmentVariableKeys": environmentVariableKeys,
                    "docResources": docResources,
                }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Failed to retrieve package.json and environment variable keys',
                    details: error.message 
                }));
            }
        });
    
    } 
    // File system endpoints
    else if (req.method === 'POST' && req.url === '/files/create') {
        handleFileOperation(req, res, fileOperations.create);
    }
    else if (req.method === 'PUT' && req.url === '/files/update') {
        handleFileOperation(req, res, fileOperations.update);
    }
    else if (req.method === 'DELETE' && req.url === '/files/delete') {
        handleFileOperation(req, res, fileOperations.delete);
    }
    else if (req.method === 'POST' && req.url === '/files/read') {
        handleFileOperation(req, res, fileOperations.read);
    }
    else if (req.method === 'POST' && req.url === '/files/list') {
        handleFileOperation(req, res, fileOperations.list);
    }
    // Bulk file operations (for backward compatibility and explicit bulk endpoints)
    else if (req.method === 'POST' && req.url === '/files/bulk/create') {
        handleFileOperation(req, res, fileOperations.create);
    }
    else if (req.method === 'PUT' && req.url === '/files/bulk/update') {
        handleFileOperation(req, res, fileOperations.update);
    }
    else if (req.method === 'POST' && req.url === '/files/bulk/read') {
        handleFileOperation(req, res, fileOperations.read);
    }
    // Backup management endpoints
    else if (req.method === 'GET' && req.url === '/files/backups') {
        try {
            const backupFiles = fs.readdirSync(FILE_PROTECTION_CONFIG.backupDir)
                .map(file => {
                    const filePath = path.join(FILE_PROTECTION_CONFIG.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: stats.size,
                        created: stats.birthtime.toISOString(),
                        modified: stats.mtime.toISOString()
                    };
                })
                .sort((a, b) => new Date(b.created) - new Date(a.created));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                backups: backupFiles,
                count: backupFiles.length,
                backupDir: FILE_PROTECTION_CONFIG.backupDir
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    // Enhanced API endpoints
    else if (req.method === 'GET' && req.url === '/project/analyze') {
        try {
            const projectInfo = detectProjectType();
            const suggestions = getProjectSuggestions(projectInfo);
            
            const analysis = {
                ...projectInfo,
                suggestions,
                timestamp: new Date().toISOString(),
                structure: scanProjectStructure()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(analysis));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    // System health check endpoint
    else if (req.method === 'GET' && req.url === '/system/health') {
        try {
            const health = {
                timestamp: new Date().toISOString(),
                status: 'healthy',
                criticalFiles: FILE_PROTECTION_CONFIG.criticalSystemFiles.map(file => ({
                    file,
                    exists: fs.existsSync(file),
                    size: fs.existsSync(file) ? fs.statSync(file).size : 0
                })),
                protectedDirs: FILE_PROTECTION_CONFIG.protectedDirectories.map(dir => ({
                    directory: dir,
                    exists: fs.existsSync(dir)
                })),
                backupSystem: {
                    backupDir: FILE_PROTECTION_CONFIG.backupDir,
                    exists: fs.existsSync(FILE_PROTECTION_CONFIG.backupDir),
                    backupCount: fs.existsSync(FILE_PROTECTION_CONFIG.backupDir) ? 
                        fs.readdirSync(FILE_PROTECTION_CONFIG.backupDir).length : 0
                }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(health));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    // Git branch management endpoint
    else if (req.method === 'POST' && req.url === '/git/branch-workflow') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const { 
                    branchName, 
                    description = 'No description provided',
                    author = 'Unknown',
                    purpose = 'General development'
                } = payload;
                
                if (!branchName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'branchName is required' }));
                    return;
                }
                
                // Validate branch name (alphanumeric, hyphens, underscores, forward slashes)
                if (!/^[a-zA-Z0-9\-_\/]+$/.test(branchName)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: 'Invalid branch name. Use only alphanumeric characters, hyphens, underscores, and forward slashes.' 
                    }));
                    return;
                }
                
                console.log(`🌿 Starting git branch workflow for: ${branchName}`);
                
                // Step 1: Check if branch exists
                const checkBranchCmd = `git show-ref --verify --quiet refs/heads/${branchName}`;
                let branchExists = false;
                
                try {
                    const checkResult = await new Promise((resolve) => {
                        const checkProc = spawn('sh', ['-c', checkBranchCmd]);
                        checkProc.on('close', (code) => {
                            resolve(code === 0);
                        });
                    });
                    branchExists = checkResult;
                } catch (error) {
                    console.log('Error checking branch:', error.message);
                }
                
                // Step 2: Create branch if it doesn't exist
                let createdNewBranch = false;
                if (!branchExists) {
                    console.log(`📝 Creating new branch: ${branchName}`);
                    const createBranchCmd = `git checkout -b ${branchName}`;
                    
                    const createResult = await new Promise((resolve, reject) => {
                        const createProc = spawn('sh', ['-c', createBranchCmd]);
                        let stdout = '';
                        let stderr = '';
                        
                        createProc.stdout.on('data', (data) => {
                            stdout += data.toString();
                        });
                        
                        createProc.stderr.on('data', (data) => {
                            stderr += data.toString();
                        });
                        
                        createProc.on('close', (code) => {
                            if (code === 0) {
                                resolve({ success: true, stdout, stderr });
                            } else {
                                reject(new Error(`Failed to create branch: ${stderr || stdout}`));
                            }
                        });
                    });
                    
                    createdNewBranch = true;
                    console.log('✅ Branch created successfully');
                } else {
                    // Checkout existing branch
                    console.log(`🔄 Checking out existing branch: ${branchName}`);
                    const checkoutCmd = `git checkout ${branchName}`;
                    
                    await new Promise((resolve, reject) => {
                        const checkoutProc = spawn('sh', ['-c', checkoutCmd]);
                        let stderr = '';
                        
                        checkoutProc.stderr.on('data', (data) => {
                            stderr += data.toString();
                        });
                        
                        checkoutProc.on('close', (code) => {
                            if (code === 0) {
                                resolve({ success: true });
                            } else {
                                reject(new Error(`Failed to checkout branch: ${stderr}`));
                            }
                        });
                    });
                    
                    console.log('✅ Branch checked out successfully');
                }
                
                // Step 3: Create metadata file
                const metadataFileName = `.branch-metadata-${branchName.replace(/\//g, '-')}.txt`;
                const metadataContent = `Branch Metadata
===============
Branch Name: ${branchName}
Created/Updated: ${new Date().toISOString()}
Author: ${author}
Purpose: ${purpose}
Description: ${description}

Status: ${createdNewBranch ? 'New branch created' : 'Existing branch updated'}

---
This file contains metadata about the branch and its purpose.
It helps track branch information and development context.
`;
                
                fs.writeFileSync(metadataFileName, metadataContent, 'utf8');
                console.log(`📄 Created metadata file: ${metadataFileName}`);
                
                // Step 4: Git add the metadata file
                const addCmd = `git add .`;
                await new Promise((resolve, reject) => {
                    const addProc = spawn('sh', ['-c', addCmd]);
                    addProc.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error('Failed to add metadata file'));
                        }
                    });
                });
                
                // Step 5: Commit the changes
                const commitMessage = createdNewBranch 
                    ? `Initial branch setup: ${branchName}\n\nAdded branch metadata file\nPurpose: ${purpose}\nDescription: ${description}`
                    : `Updated branch metadata: ${branchName}\n\nUpdated metadata file\nPurpose: ${purpose}\nDescription: ${description}`;
                
                const commitCmd = `git commit -m "${commitMessage}"`;
                
                let commitResult = await new Promise((resolve) => {
                    const commitProc = spawn('sh', ['-c', commitCmd]);
                    let stdout = '';
                    let stderr = '';
                    
                    commitProc.stdout.on('data', (data) => {
                        stdout += data.toString();
                    });
                    
                    commitProc.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    
                    commitProc.on('close', (code) => {
                        resolve({ 
                            success: code === 0, 
                            stdout, 
                            stderr,
                            code
                        });
                    });
                });
                
                console.log('✅ Changes committed');
                
                // Step 6: Push to remote (optional, only if remote exists)
                let pushResult = null;
                try {
                    // Check if remote exists
                    const checkRemoteCmd = 'git remote -v';
                    const hasRemote = await new Promise((resolve) => {
                        const remoteProc = spawn('sh', ['-c', checkRemoteCmd]);
                        let stdout = '';
                        
                        remoteProc.stdout.on('data', (data) => {
                            stdout += data.toString();
                        });
                        
                        remoteProc.on('close', () => {
                            resolve(stdout.includes('origin'));
                        });
                    });
                    
                    if (hasRemote) {
                        console.log('📤 Pushing to remote...');
                        const pushCmd = `git push -u origin ${branchName}`;
                        
                        pushResult = await new Promise((resolve) => {
                            const pushProc = spawn('sh', ['-c', pushCmd]);
                            let stdout = '';
                            let stderr = '';
                            
                            pushProc.stdout.on('data', (data) => {
                                stdout += data.toString();
                            });
                            
                            pushProc.stderr.on('data', (data) => {
                                stderr += data.toString();
                            });
                            
                            pushProc.on('close', (code) => {
                                resolve({ 
                                    success: code === 0,
                                    stdout,
                                    stderr,
                                    pushed: code === 0
                                });
                            });
                        });
                        
                        if (pushResult.success) {
                            console.log('✅ Pushed to remote successfully');
                        } else {
                            console.log('⚠️ Push to remote failed (may need authentication)');
                        }
                    } else {
                        console.log('ℹ️ No remote configured, skipping push');
                    }
                } catch (error) {
                    console.log('⚠️ Could not push to remote:', error.message);
                }
                
                // Prepare response
                const response = {
                    success: true,
                    branchName,
                    branchStatus: createdNewBranch ? 'created' : 'checked_out',
                    metadataFile: metadataFileName,
                    metadataContent,
                    commitResult: {
                        success: commitResult.success,
                        message: commitMessage
                    },
                    pushResult: pushResult ? {
                        success: pushResult.success,
                        pushed: pushResult.pushed
                    } : { 
                        success: false, 
                        message: 'No remote configured or push skipped' 
                    },
                    timestamp: new Date().toISOString()
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
                
            } catch (error) {
                console.error('❌ Git workflow error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: error.message,
                    type: 'GitWorkflowError'
                }));
            }
        });
    }
    // Template management endpoints
    else if (req.method === 'GET' && req.url === '/templates') {
        try {
            const templates = Object.keys(PROJECT_TEMPLATES).map(key => ({
                id: key,
                name: PROJECT_TEMPLATES[key].name,
                description: PROJECT_TEMPLATES[key].description
            }));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ templates }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    else if (req.method === 'POST' && req.url === '/templates/generate') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const { templateId, projectName } = JSON.parse(body);
                
                if (!templateId || !PROJECT_TEMPLATES[templateId]) {
                    return res.status(400).json({ error: 'Invalid template ID' });
                }
                
                const template = PROJECT_TEMPLATES[templateId];
                const projectDir = projectName || `${templateId}-project`;
                
                // Check if project directory already exists
                if (fs.existsSync(projectDir)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: `Project directory '${projectDir}' already exists. Please choose a different name.` 
                    }));
                    return;
                }
                
                // Function to create files recursively - ENHANCED WITH PARALLEL PROCESSING
                const createFiles = async (structure, basePath = '') => {
                    const results = [];
                    const fileOperations = [];
                    const dirOperations = [];
                    
                    console.log(`📁 Preparing operations for path: ${basePath || 'root'}`);
                    
                    // First pass: collect all operations
                    for (const [name, content] of Object.entries(structure)) {
                        const fullPath = path.join(basePath, name);
                        
                        if (typeof content === 'string') {
                            // It's a file - prepare file operation
                            fileOperations.push({
                                name,
                                fullPath,
                                content,
                                type: 'file'
                            });
                        } else if (typeof content === 'object') {
                            // It's a directory - prepare directory operation
                            dirOperations.push({
                                name,
                                fullPath,
                                content,
                                type: 'directory'
                            });
                        }
                    }
                    
                    // Create all directories first (must be sequential for dependencies)
                    for (const dirOp of dirOperations) {
                        if (!fs.existsSync(dirOp.fullPath)) {
                            fs.mkdirSync(dirOp.fullPath, { recursive: true });
                        }
                        results.push({ type: 'directory', path: dirOp.fullPath });
                        
                        // Recursively process subdirectories
                        const subResults = await createFiles(dirOp.content, dirOp.fullPath);
                        results.push(...subResults);
                    }
                    
                    // Execute all file operations in parallel
                    if (fileOperations.length > 0) {
                        console.log(`⚡ Creating ${fileOperations.length} files in parallel...`);
                        const filePromises = fileOperations.map(async (fileOp) => {
                            const analysis = validateFileOperation(fileOp.fullPath, 'create');
                            const dir = path.dirname(fileOp.fullPath);
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            // Note: fs.writeFileSync is synchronous, but we're still parallelizing the validation
                            fs.writeFileSync(fileOp.fullPath, fileOp.content, 'utf8');
                            return { type: 'file', path: fileOp.fullPath, size: fileOp.content.length };
                        });
                        
                        const fileResults = await Promise.all(filePromises);
                        results.push(...fileResults);
                    }
                    
                    return results;
                };
                
                // Create project directory
                if (!fs.existsSync(projectDir)) {
                    fs.mkdirSync(projectDir, { recursive: true });
                }
                
                // Create structure files
                const structureResults = await createFiles(template.structure, projectDir);
                
                // Create config files
                const configResults = await createFiles(template.configs, projectDir);
                
                const allResults = [...structureResults, ...configResults];
                
                console.log(`📦 Generated ${templateId} project: ${projectDir}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    templateId,
                    projectName: projectDir,
                    filesCreated: allResults.filter(r => r.type === 'file').length,
                    directoriesCreated: allResults.filter(r => r.type === 'directory').length,
                    files: allResults,
                    timestamp: new Date().toISOString()
                }));
                
            } catch (error) {
                console.error('Template generation error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    else if(req.method === 'POST' && req.url === '/execute') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async() => {
            try {
                const payload = JSON.parse(body);

                if (payload.command) {
                    console.log(payload.command);
                    // Enhanced code execution with pattern-based validation
                    console.log(payload)
                    try {
                        validateCommand(payload.command);
                        executeCodeWithAsyncSupport(payload, res);
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ 
                            error: error.message,
                            type: 'CommandValidationError'
                        }));
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Code is required' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Looks there was an error did you review or look at docs before executing this request?' }));
            }
        });
    }
    // Browser automation endpoints
    else if (req.method === 'POST' && req.url === '/browser/screenshot') {
        handleBrowserOperation(req, res, browserOperations.screenshot);
    }
    else if (req.method === 'POST' && req.url === '/browser/navigate') {
        handleBrowserOperation(req, res, browserOperations.navigate);
    }
    else if (req.method === 'POST' && req.url === '/browser/console') {
        handleBrowserOperation(req, res, browserOperations.getConsoleLogs);
    }
    else if (req.method === 'POST' && req.url === '/browser/evaluate') {
        handleBrowserOperation(req, res, browserOperations.evaluate);
    }
    else if (req.method === 'POST' && req.url === '/browser/click') {
        handleBrowserOperation(req, res, browserOperations.click);
    }
    else if (req.method === 'POST' && req.url === '/browser/type') {
        handleBrowserOperation(req, res, browserOperations.type);
    }
    else if (req.method === 'POST' && req.url === '/browser/wait') {
        handleBrowserOperation(req, res, browserOperations.waitFor);
    }
    else if (req.method === 'POST' && req.url === '/browser/content') {
        handleBrowserOperation(req, res, browserOperations.getPageContent);
    }
    else if (req.method === 'POST' && req.url === '/browser/close') {
        handleBrowserOperation(req, res, browserOperations.closeBrowser);
    }
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Enhanced code execution function with better async support
async function executeCodeWithAsyncSupport(payload, res) {
    const tempFile = `temp_${Date.now()}.js`;
    let codeToExecute = payload.command.trim();
    
    
    
        // Validate the command against whitelist
      
        
        // Store the original command before wrapping
        const originalCommand = codeToExecute;
        
        // Wrap the approved command in childExec and capture output
        const wrappedCommand = `const result = await childExec('${originalCommand.replace(/'/g, "\\'")}'); 
console.log('📤 COMMAND OUTPUT:');
if (result.stdout && result.stdout.trim()) {
    console.log('📤 STDOUT:');
    console.log(result.stdout);
}
if (result.stderr && result.stderr.trim()) {
    console.log('📤 STDERR:');  
    console.log(result.stderr);
}
console.log('📊 Exit code:', result.code);`;
        console.log('🔄 Auto-wrapped command with output capture');
    
         // Define the childExec function that will be available in the executed code
         const childExecFunction = `
const { spawn } = require('child_process');

function childExec(command) {
    return new Promise((resolve, reject) => {
        console.log('🚀 Executing command:', command);
        
        // Check if command contains shell operators (pipes, redirects, etc.)
        const hasShellOperators = /[|&;<>(){}]/.test(command);
        
        let child;
        if (hasShellOperators) {
            // Use shell for complex commands with pipes, etc.
            child = spawn('sh', ['-c', command], { stdio: 'pipe' });
        } else {
            // Use direct spawn for simple commands
            const [cmd, ...args] = command.split(' ');
            child = spawn(cmd, args, { stdio: 'pipe' });
        }
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            process.stdout.write(data);
        });
        
        child.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            process.stderr.write(data);
        });
        
        child.on('close', (code) => {
            console.log(\`\\n📋 Command completed with exit code: \${code}\`);
            resolve({ code, stdout, stderr, command });
        });
        
        child.on('error', (error) => {
            console.error('❌ Command failed:', error.message);
            console.error('❌ Error code:', error.code);
            reject(error);
        });
    });
}
`;

         // Configurable async timeout - default 5 seconds for API calls
         const asyncTimeout = payload.asyncTimeout || 5000;
         
         // Create final code with childExec function + async wrapped user code
         codeToExecute = `
${childExecFunction}

(async () => {
     try {
         ${wrappedCommand}
        
        // Wait for any pending async operations (configurable timeout)
        await new Promise(resolve => setTimeout(resolve, ${asyncTimeout}));
        
    } catch (error) {
        console.error('❌ Execution error:', error.message);
        console.error('❌ Error type:', error.constructor.name);
        console.error('❌ Stack trace:', error.stack);
        
        // Try to log additional error details
        if (error.code) console.error('❌ Error code:', error.code);
        if (error.errno) console.error('❌ Error number:', error.errno);
        if (error.syscall) console.error('❌ System call:', error.syscall);
        if (error.allowedCommands) console.error('❌ Allowed commands:', error.allowedCommands);
        
        process.exit(1);
    }
})().then(() => {
    // Give a moment for any final logs
    setTimeout(() => {
        console.log('\\n--- 🏁 Execution completed ---');
        process.exit(0);
    }, 200);
}).catch(error => {
    console.error('❌ Promise rejection:', error.message);
    console.error('❌ Promise rejection stack:', error.stack);
    if (error.allowedCommands) console.error('❌ Allowed commands:', error.allowedCommands);
    process.exit(1);
});

// Handle unhandled promise rejections with more details
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection at:', promise);
    console.error('❌ Reason:', reason);
    if (reason && reason.stack) {
        console.error('❌ Stack:', reason.stack);
    }
    if (reason && reason.allowedCommands) {
        console.error('❌ Allowed commands:', reason.allowedCommands);
    }
    process.exit(1);
});

// Handle uncaught exceptions with more details
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    console.error('❌ Exception stack:', error.stack);
    console.error('❌ Exception type:', error.constructor.name);
    if (error.allowedCommands) {
        console.error('❌ Allowed commands:', error.allowedCommands);
    }
    process.exit(1);
});
`;
    
    
    try {
        fs.writeFileSync(tempFile, codeToExecute);
        const allowedEnvVars = [
            'PATH',
            'HOME',
            'USER',
            'NODE_ENV',
            'TZ',
            'LANG',
            'LC_ALL',
            'PWD',
            'TMPDIR',
            'TEMP',
            'TMP'
        ];
        
        // Create limited environment with only allowed variables
        const limitedEnv = {};
        
        // Add basic allowed environment variables
        allowedEnvVars.forEach(key => {
            if (process.env[key]) {
                limitedEnv[key] = process.env[key];
            }
        });
        
        // Add all environment variables that start with "KEYBOARD"
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('KEYBOARD')) {
                limitedEnv[key] = process.env[key];
            }
        });
        
        // Enhanced execution with timeout and long operation support
        executeProcessWithTimeout('node', [tempFile], res, () => {
            try {
                fs.unlinkSync(tempFile);
            } catch (e) {
                // File might already be deleted
            }
        }, {
            timeout: payload.timeout || (payload.longOperation ? 300000 : 30000), // 5 min for long ops, 30s default
            env: { ...limitedEnv }, // Allow custom environment variables
            longOperation: payload.longOperation || false, // Flag for long operations
            streamOutput: payload.streamOutput || false, // Enable output streaming
            keepAliveInterval: payload.keepAliveInterval || 10000 // Keep-alive interval for long ops
        });
        
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Failed to write temporary file',
            details: error.message 
        }));
    }
}

// Enhanced process execution with timeout and better error handling for long async operations
function executeProcessWithTimeout(cmd, args, res, cleanup = null, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || 30000;
    const longOperation = options.longOperation || false; // Flag for long operations
    const streamOutput = options.streamOutput || false; // Flag for streaming output
    const keepAliveInterval = options.keepAliveInterval || 10000; // Send keep-alive every 10s for long ops
    
    const child = spawn(cmd, args, { env: options?.env || {}});
    let stdout = '';
    let stderr = '';
    let isCompleted = false;
    let lastOutputTime = Date.now();
    let keepAliveTimer = null;
    let outputChunks = [];
    
    // For long operations, set up keep-alive mechanism and different timeout handling
    if (longOperation) {
        console.log(`🕐 Starting long operation with extended monitoring...`);
        
        // Send periodic keep-alive updates for very long operations
        keepAliveTimer = setInterval(() => {
            if (!isCompleted) {
                const elapsed = Date.now() - startTime;
                const timeSinceLastOutput = Date.now() - lastOutputTime;
                
                console.log(`⏳ Long operation progress: ${Math.floor(elapsed/1000)}s elapsed, ${Math.floor(timeSinceLastOutput/1000)}s since last output`);
                
                // If streaming is enabled, send a progress update
                if (streamOutput && res.writable) {
                    try {
                        const progressUpdate = {
                            type: 'progress',
                            elapsed: elapsed,
                            timeSinceLastOutput: timeSinceLastOutput,
                            stdout: stdout.slice(-500), // Last 500 chars of output
                            stderr: stderr.slice(-500)
                        };
                        
                        // Send as Server-Sent Events style update
                        res.write(`data: ${JSON.stringify(progressUpdate)}\n\n`);
                    } catch (e) {
                        console.log('Failed to send progress update:', e.message);
                    }
                }
            }
        }, keepAliveInterval);
    }
    
    // Set up timeout with different behavior for long operations
    const timeoutId = setTimeout(() => {
        if (!isCompleted) {
            isCompleted = true;
            
            if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
            }
            
            // For long operations, try graceful shutdown first
            if (longOperation) {
                console.log('🛑 Long operation timeout - attempting graceful shutdown...');
                child.kill('SIGTERM');
                
                // Give process 5 seconds to shutdown gracefully, then force kill
                setTimeout(() => {
                    if (!child.killed) {
                        console.log('💀 Force killing long operation process...');
                        child.kill('SIGKILL');
                    }
                }, 5000);
            } else {
                child.kill('SIGTERM');
            }
            
            if (cleanup) cleanup();
            
            const elapsed = Date.now() - startTime;
            let timeoutResult = { 
                error: 'Execution timeout',
                timeout: timeout,
                elapsed: elapsed,
                stdout: stdout,
                stderr: stderr,
                message: longOperation 
                    ? `Long operation timed out after ${timeout}ms (${Math.floor(elapsed/1000)}s elapsed). Consider increasing timeout or checking operation progress.`
                    : `Process timed out after ${timeout}ms. Consider increasing timeout or optimizing async operations.`,
                isLongOperation: longOperation
            };
            
            res.writeHead(408, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(timeoutResult));
        }
    }, timeout);
    
    child.stdout.on('data', data => {
        const chunk = data.toString();
        stdout += chunk;
        lastOutputTime = Date.now();
        
        // Store output chunks for analysis
        outputChunks.push({
            type: 'stdout',
            data: chunk,
            timestamp: Date.now()
        });
        
        // For long operations, log significant output
        if (longOperation && chunk.trim()) {
            console.log(`📝 Long operation output: ${chunk.trim().slice(0, 200)}${chunk.length > 200 ? '...' : ''}`);
        }
        
        // Stream output if enabled
        if (streamOutput && res.writable) {
            try {
                const streamData = {
                    type: 'stdout',
                    data: chunk,
                    timestamp: Date.now()
                };
                res.write(`data: ${JSON.stringify(streamData)}\n\n`);
            } catch (e) {
                console.log('Failed to stream stdout:', e.message);
            }
        }
    });

    child.stderr.on('data', data => {
        const chunk = data.toString();
        stderr += chunk;
        lastOutputTime = Date.now();
        
        // Store output chunks for analysis
        outputChunks.push({
            type: 'stderr',
            data: chunk,
            timestamp: Date.now()
        });
        
        // Always log stderr immediately as it usually contains important error information
        console.error(`🚨 STDERR [${cmd} ${args.join(' ')}]: ${chunk.trim()}`);
        
        // For long operations, log errors with more context
        if (longOperation && chunk.trim()) {
            console.log(`⚠️ Long operation error: ${chunk.trim().slice(0, 200)}${chunk.length > 200 ? '...' : ''}`);
        }
        
        // Stream error output if enabled
        if (streamOutput && res.writable) {
            try {
                const streamData = {
                    type: 'stderr',
                    data: chunk,
                    timestamp: Date.now()
                };
                res.write(`data: ${JSON.stringify(streamData)}\n\n`);
            } catch (e) {
                console.log('Failed to stream stderr:', e.message);
            }
        }
    });

    child.on('close', async (code) => {
        if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            
            if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
            }
            
            if (cleanup) cleanup();
            
            const elapsed = Date.now() - startTime;
            
            if (longOperation) {
                console.log(`✅ Long operation completed in ${Math.floor(elapsed/1000)}s with code ${code}`);
            }

            let finalResult = { 
                success: true,
                data: {
                    stdout, 
                    stderr, 
                    code,
                    executionTime: elapsed,
                    startTime: startTime,
                    endTime: Date.now(),
                    isLongOperation: longOperation,
                    outputChunks: longOperation ? outputChunks.length : undefined,
                    lastOutputTime: lastOutputTime
                }
            };
            
            // Send final result
            if (streamOutput) {
                // Send completion event for streaming
                try {
                    res.write(`data: ${JSON.stringify({type: 'complete', result: finalResult})}\n\n`);
                    res.end();
                } catch (e) {
                    console.log('Failed to send completion event:', e.message);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(finalResult));
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(finalResult));
            }
        }
    });

    child.on('error', error => {
        if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            
            if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
            }
            
            if (cleanup) cleanup();
            
            const elapsed = Date.now() - startTime;
            
            if (longOperation) {
                console.log(`❌ Long operation failed after ${Math.floor(elapsed/1000)}s: ${error.message}`);
            }
            
            // Enhanced error diagnostics for spawn issues
            const diagnostics = {
                command: `${cmd} ${args.join(' ')}`,
                workingDirectory: process.cwd(),
                pathEnv: process.env.PATH || 'PATH not set',
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            };
            
            // Additional diagnostics for ENOENT errors
            if (error.code === 'ENOENT') {
                diagnostics.likely_cause = `Command '${cmd}' not found in system PATH`;
                diagnostics.suggestions = [
                    `Verify ${cmd} is installed on the system`,
                    `Check if ${cmd} is in the PATH environment variable`,
                    `Try running 'which ${cmd}' or 'where ${cmd}' to locate the executable`,
                    'Consider using the full path to the executable'
                ];
                
                // Try to provide more specific help for common commands
                if (cmd === 'npm') {
                    diagnostics.npm_help = [
                        'Install Node.js which includes npm: https://nodejs.org/',
                        'Verify installation with: node --version && npm --version',
                        'Check npm global installation path: npm config get prefix'
                    ];
                } else if (cmd === 'yarn') {
                    diagnostics.yarn_help = [
                        'Install yarn: npm install -g yarn',
                        'Or install via package manager specific to your OS'
                    ];
                } else if (cmd === 'pnpm') {
                    diagnostics.pnpm_help = [
                        'Install pnpm: npm install -g pnpm',
                        'Or install via: curl -fsSL https://get.pnpm.io/install.sh | sh -'
                    ];
                }
            }
            
            // Log stderr if available
            if (stderr.trim()) {
                console.error('❌ Process stderr output:');
                console.error(stderr);
            }
            
            // Log stdout if available (might contain error info)
            if (stdout.trim()) {
                console.error('❌ Process stdout output:');
                console.error(stdout);
            }
            
            console.error('❌ Spawn Error Details:', {
                message: error.message,
                code: error.code,
                type: error.constructor.name,
                command: `${cmd} ${args.join(' ')}`
            });
            
            console.error('❌ Spawn Error Diagnostics:', JSON.stringify(diagnostics, null, 2));
            
            let errorResult = { 
                success: false,
                error: {
                    message: error.message,
                    type: error.constructor.name,
                    code: error.code,
                    command: `${cmd} ${args.join(' ')}`,
                    stdout: stdout,
                    stderr: stderr,
                    executionTime: elapsed,
                    isLongOperation: longOperation,
                    outputChunks: longOperation ? outputChunks.length : undefined,
                    diagnostics: diagnostics
                }
            };
            
            if (streamOutput) {
                try {
                    res.write(`data: ${JSON.stringify({type: 'error', result: errorResult})}\n\n`);
                    res.end();
                } catch (e) {
                    console.log('Failed to send error event:', e.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(errorResult));
                }
            } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(errorResult));
            }
        }
    });
}

function installPlaywright() {
  console.log('Starting Playwright dependencies installation...');
  
  // First install dependencies
  const installDeps = spawn('npx', ['playwright', 'install-deps'], {
    stdio: 'pipe'
  });

  installDeps.stdout.on('data', (data) => {
    console.log(`Playwright deps: ${data}`);
  });

  installDeps.stderr.on('data', (data) => {
    console.error(`Playwright deps error: ${data}`);
  });

  installDeps.on('close', (code) => {
    console.log(`Playwright dependencies installation completed with code ${code}`);
    
    if (code === 0) {
      // Then install chromium
      console.log('Starting Chromium installation...');
      const installChromium = spawn('npx', ['playwright', 'install', 'chromium'], {
        stdio: 'pipe'
      });

      installChromium.stdout.on('data', (data) => {
        console.log(`Playwright chromium: ${data}`);
      });

      installChromium.stderr.on('data', (data) => {
        console.error(`Playwright chromium error: ${data}`);
      });

      installChromium.on('close', (chromiumCode) => {
        console.log(`Chromium installation completed with code ${chromiumCode}`);
      });
    } else {
      console.error('Dependencies installation failed, skipping Chromium installation');
    }
  });

  installDeps.on('error', (error) => {
    console.error(`Playwright installation error: ${error}`);
  });
}



const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Server available at: http://localhost:${PORT}`);
    installPlaywright();
    // 🎯 KEY: Start Ollama setup ONLY after server is confirmed running
 
});
