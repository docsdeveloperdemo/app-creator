const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { retrievePackageJson, retrieveEnvironmentVariableKeys, retrieveDocResources } = require('./keyboard_utils/retrieve_resources/keybooard_resources');

// File protection and backup utilities - Functional approach

// Configuration constants
const FILE_PROTECTION_CONFIG = {
    backupDir: path.join(process.cwd(), '.file-backups'),
    protectedFiles: [
        'keyboard_server.js',
        '.env',
        '.gitignore'
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

// Utility functions
const ensureBackupDirectory = () => {
    if (!fs.existsSync(FILE_PROTECTION_CONFIG.backupDir)) {
        fs.mkdirSync(FILE_PROTECTION_CONFIG.backupDir, { recursive: true });
    }
};

const isProtectedFile = (filePath) => {
    const fileName = path.basename(filePath);
    return FILE_PROTECTION_CONFIG.protectedFiles.includes(fileName);
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

const createBackup = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }

        ensureBackupDirectory();

        const fileName = path.basename(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `${fileName}.${timestamp}.backup`;
        const backupPath = path.join(FILE_PROTECTION_CONFIG.backupDir, backupFileName);

        // Copy file to backup location
        fs.copyFileSync(filePath, backupPath);

        // Clean up old backups
        await cleanupOldBackups(fileName);

        console.log(`📦 Created backup: ${backupFileName}`);
        return backupPath;
    } catch (error) {
        console.error(`❌ Failed to create backup for ${filePath}:`, error.message);
        throw error;
    }
};

// Bulk operation utilities
const processBulkOperation = async (files, operation) => {
    if (!Array.isArray(files)) {
        // Single file operation
        return await operation(files);
    }
    
    // Bulk operation
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        try {
            const result = await operation(files[i]);
            results.push({
                index: i,
                file: files[i],
                success: true,
                result: result
            });
        } catch (error) {
            errors.push({
                index: i,
                file: files[i],
                success: false,
                error: error.message,
                type: error.constructor.name
            });
        }
    }
    
    return {
        success: errors.length === 0,
        totalFiles: files.length,
        successCount: results.length,
        errorCount: errors.length,
        results: results,
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

// Command whitelist for security - only allow React/Next.js project commands
function getAllowedCommands() {
    return [
        // NPM commands
        'npm run dev',
        'npm run start',
        'npm run build',
        'npm run serve',
        'npm run preview',
        'npm install',
        'npm ci',
        'npm run lint',
        'npm run test',
        'npm run type-check',
        
        // Yarn commands
        'yarn dev',
        'yarn start',
        'yarn build',
        'yarn serve',
        'yarn preview',
        'yarn install',
        'yarn',
        'yarn lint',
        'yarn test',
        'yarn type-check',
        
        // PNPM commands
        'pnpm dev',
        'pnpm start',
        'pnpm build',
        'pnpm serve',
        'pnpm preview',
        'pnpm install',
        'pnpm i',
        'pnpm lint',
        'pnpm test',
        'pnpm type-check',
        
        // Project creation commands
        'npx create-react-app',
        'npx create-next-app',
        'npm create react-app',
        'npm create next-app',
        'yarn create react-app',
        'yarn create next-app',
        'pnpm create react-app',
        'pnpm create next-app',
        
        // Vite commands
        'npm run vite',
        'yarn vite',
        'pnpm vite',
        'npx vite',
        'npx vite build',
        'npx vite preview',
        
        // Next.js specific
        'npx next dev',
        'npx next start',
        'npx next build',
        'npx next lint',
        
        // React scripts
        'npx react-scripts start',
        'npx react-scripts build',
        'npx react-scripts test',
        
        // Development server alternatives
        'npm run storybook',
        'yarn storybook',
        'pnpm storybook',
        'npx storybook dev',
        'git pull origin main',
    ];
}

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
        
        // Validate credential access
        validateCredentialAccess(filePath, 'create');
        
        const fullPath = validateFilePath(filePath);
        
        // Check if file exists and overwrite is not allowed
        if (fs.existsSync(fullPath) && !overwrite) {
            throw new Error(`File ${filePath} already exists. Set overwrite=true to replace.`);
        }
        
        // Create backup if file exists and is protected
        let backupPath = null;
        if (fs.existsSync(fullPath)) {
            if (isProtectedFile(fullPath)) {
                backupPath = await createBackup(fullPath);
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
        const { filePath, content, createBackup = true } = payload;
        
        // Validate credential access
        validateCredentialAccess(filePath, 'update');
        
        const fullPath = validateFilePath(filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File ${filePath} does not exist. Use create operation instead.`);
        }
        
        // Create backup if requested or file is protected
        let backupPath = null;
        if (createBackup || isProtectedFile(fullPath)) {
            backupPath = await createBackup(fullPath);
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
                    // Enhanced code execution with async support
                    console.log(payload)
                    let allowedCommands = getAllowedCommands();
                    if(!allowedCommands.includes(payload.command)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Command not allowed. Only npm/yarn/pnpm commands for React/Next.js projects are permitted.' }));
                    }
                    executeCodeWithAsyncSupport(payload, res);
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Code is required' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Looks there was an error did you review or look at docs before executing this request?' }));
            }
        });
    } else {
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
        
        // Wrap the approved command in childExec
        const wrappedCommand = `await childExec('${originalCommand.replace(/'/g, "\\'")}')`;
        console.log('🔄 Auto-wrapped command:', wrappedCommand);
    
         // Define the childExec function that will be available in the executed code
         const childExecFunction = `
const { spawn } = require('child_process');

function childExec(command) {
    return new Promise((resolve, reject) => {
        console.log('🚀 Executing command:', command);
        
        const [cmd, ...args] = command.split(' ');
        const child = spawn(cmd, args, { stdio: 'pipe' });
        
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



const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Server available at: http://localhost:${PORT}`);
    
    // 🎯 KEY: Start Ollama setup ONLY after server is confirmed running
 
});