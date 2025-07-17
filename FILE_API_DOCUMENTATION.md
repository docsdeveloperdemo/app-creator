# File System API Documentation

## Overview

This server now includes comprehensive file system operations with built-in protection mechanisms. All file operations are secured against path traversal attacks and include automatic backup functionality for protected files.

## Protected Files

The following files are automatically protected and will have backups created before any modifications:
- `keyboard_server.js`
- `package.json`
- `package-lock.json`
- `.env`
- `.gitignore`

## Security Features

1. **Path Traversal Protection**: All file paths are validated to prevent access outside the project directory
2. **Automatic Backups**: Protected files are automatically backed up before modification
3. **File Size Limits**: Files larger than 10MB are rejected by default
4. **Force Protection**: Protected files cannot be deleted without explicit `force=true` flag
5. **Credential File Protection**: Blocks access to sensitive files like `.env`, credential files, and private keys
6. **Bulk Operation Limits**: Maximum 50 files per bulk operation to prevent abuse

## API Endpoints

### 1. Create File (Single or Bulk)
**Endpoint:** `POST /files/create` or `POST /files/bulk/create`

Creates new files or overwrites existing ones. Supports both single file and bulk operations.

#### Single File Creation
```bash
curl -X POST http://localhost:3001/files/create \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test/example.txt",
    "content": "Hello, World!",
    "overwrite": false
  }'
```

#### Bulk File Creation
```bash
curl -X POST http://localhost:3001/files/create \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "filePath": "test/file1.txt",
        "content": "Content for file 1"
      },
      {
        "filePath": "test/file2.txt", 
        "content": "Content for file 2"
      }
    ],
    "overwrite": false
  }'
```

**Single File Request Body:**
- `filePath` (string, required): Path to the file
- `content` (string, required): File content
- `overwrite` (boolean, optional): Allow overwriting existing files

**Bulk Request Body:**
- `files` (array, required): Array of file objects with `filePath` and `content`
- `overwrite` (boolean, optional): Apply to all files in the bulk operation

**Single File Response:**
```json
{
  "success": true,
  "filePath": "test/example.txt",
  "fullPath": "/full/path/to/test/example.txt",
  "size": 13,
  "backup": null,
  "protected": false,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Bulk Operation Response:**
```json
{
  "success": true,
  "totalFiles": 2,
  "successCount": 2,
  "errorCount": 0,
  "results": [
    {
      "index": 0,
      "file": {"filePath": "test/file1.txt", "content": "Content for file 1"},
      "success": true,
      "result": {
        "success": true,
        "filePath": "test/file1.txt",
        "size": 17
      }
    }
  ],
  "errors": []
}
```

### 2. Update File (Single or Bulk)
**Endpoint:** `PUT /files/update` or `PUT /files/bulk/update`

Updates existing files' content. Supports both single file and bulk operations.

#### Single File Update
```bash
curl -X PUT http://localhost:3001/files/update \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test/example.txt",
    "content": "Updated content!",
    "createBackup": true
  }'
```

#### Bulk File Update
```bash
curl -X PUT http://localhost:3001/files/update \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "filePath": "test/file1.txt",
        "content": "Updated content for file 1"
      },
      {
        "filePath": "test/file2.txt",
        "content": "Updated content for file 2"
      }
    ],
    "createBackup": true
  }'
```

**Single File Request Body:**
- `filePath` (string, required): Path to the file
- `content` (string, required): New file content
- `createBackup` (boolean, optional): Force backup creation

**Bulk Request Body:**
- `files` (array, required): Array of file objects with `filePath` and `content`
- `createBackup` (boolean, optional): Apply to all files in the bulk operation

### 3. Delete File
**Endpoint:** `DELETE /files/delete`

Deletes a file with optional force flag for protected files.

```bash
curl -X DELETE http://localhost:3001/files/delete \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test/example.txt",
    "force": false
  }'
```

**Request Body:**
- `filePath` (string, required): Path to the file to delete
- `force` (boolean, optional): Force deletion of protected files

### 4. Read File (Single or Bulk)
**Endpoint:** `POST /files/read` or `POST /files/bulk/read`

Reads the content of files. Supports both single file and bulk operations.
**Note:** Credential files (`.env`, private keys, etc.) are blocked for security.

#### Single File Read
```bash
curl -X POST http://localhost:3001/files/read \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test/example.txt",
    "encoding": "utf8"
  }'
```

#### Bulk File Read
```bash
curl -X POST http://localhost:3001/files/read \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {"filePath": "test/file1.txt"},
      {"filePath": "test/file2.txt"}
    ],
    "encoding": "utf8"
  }'
```

**Single File Request Body:**
- `filePath` (string, required): Path to the file to read
- `encoding` (string, optional): File encoding (default: "utf8")

**Bulk Request Body:**
- `files` (array, required): Array of file objects with `filePath`
- `encoding` (string, optional): File encoding applied to all files

**Single File Response:**
```json
{
  "success": true,
  "filePath": "test/example.txt",
  "fullPath": "/full/path/to/test/example.txt",
  "content": "File content here...",
  "size": 1024,
  "modified": "2024-01-01T12:00:00.000Z",
  "protected": false,
  "credential": false
}
```

### 5. List Directory
**Endpoint:** `POST /files/list`

Lists files and directories in a given path.

```bash
curl -X POST http://localhost:3001/files/list \
  -H "Content-Type: application/json" \
  -d '{
    "dirPath": ".",
    "includeHidden": false,
    "recursive": false,
    "includeCredentials": false
  }'
```

**Request Body:**
- `dirPath` (string, optional): Directory path to list (default: ".")
- `includeHidden` (boolean, optional): Include hidden files
- `recursive` (boolean, optional): List subdirectories recursively
- `includeCredentials` (boolean, optional): Include credential files in results (default: false)

**Response:**
```json
{
  "success": true,
  "dirPath": ".",
  "fullPath": "/full/path/to/directory",
  "items": [
    {
      "name": "example.txt",
      "path": "example.txt",
      "fullPath": "/full/path/to/example.txt",
      "isDirectory": false,
      "isFile": true,
      "size": 1024,
      "modified": "2024-01-01T12:00:00.000Z",
      "protected": false,
      "credential": false
    }
  ],
  "count": 1,
  "includeHidden": false,
  "recursive": false,
  "includeCredentials": false,
  "credentialFilesFiltered": true
}
```

### 6. List Backups
**Endpoint:** `GET /files/backups`

Lists all available backup files.

```bash
curl -X GET http://localhost:3001/files/backups
```

**Response:**
```json
{
  "success": true,
  "backups": [
    {
      "name": "keyboard_server.js.2024-01-01T12-00-00-000Z.backup",
      "size": 25600,
      "created": "2024-01-01T12:00:00.000Z",
      "modified": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1,
  "backupDir": "/full/path/to/.file-backups"
}
```

## Credential File Protection

The API automatically blocks access to sensitive credential files for security. This includes:

### Protected File Types
- **Environment files**: `.env`, `.env.local`, `.env.production`, etc.
- **Credential files**: `credentials.json`, `secrets.json`, `config.json`
- **Private keys**: `private.key`, `id_rsa`, `id_ed25519`, `*.pem`, `*.p12`, `*.pfx`
- **Sensitive directories**: `.ssh`, `.aws`, `.gcp`
- **Pattern-based**: Files containing `credential`, `secret`, `password`, `token`, `wallet`, `keystore`

### Error Response for Blocked Files
```json
{
  "error": "Access denied: Cannot read credential file '.env' for security reasons",
  "type": "Error"
}
```

### Listing Credential Files
By default, credential files are filtered from directory listings. To include them:
```bash
curl -X POST http://localhost:3001/files/list \
  -H "Content-Type: application/json" \
  -d '{"includeCredentials": true}'
```

## Bulk Operations

### Bulk File Creation Example
```javascript
const bulkCreateResponse = await fetch('http://localhost:3001/files/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [
      {
        filePath: 'components/Header.jsx',
        content: 'export const Header = () => <header>My App</header>;'
      },
      {
        filePath: 'components/Footer.jsx',
        content: 'export const Footer = () => <footer>© 2024</footer>;'
      },
      {
        filePath: 'styles/main.css',
        content: 'body { margin: 0; padding: 0; }'
      }
    ],
    overwrite: true
  })
});

const result = await bulkCreateResponse.json();
console.log(`Created ${result.successCount}/${result.totalFiles} files`);
```

### Bulk File Reading Example
```javascript
const bulkReadResponse = await fetch('http://localhost:3001/files/read', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [
      {filePath: 'package.json'},
      {filePath: 'README.md'},
      {filePath: 'src/index.js'}
    ]
  })
});

const result = await bulkReadResponse.json();
if (result.success) {
  result.results.forEach(file => {
    console.log(`${file.file.filePath}: ${file.result.size} bytes`);
  });
} else {
  console.log(`Read ${result.successCount} files, ${result.errorCount} errors`);
}
```

## Backup System

### Automatic Backups
- **Protected Files**: Automatically backed up before any modification
- **Manual Backups**: Can be requested for any file using `createBackup: true`
- **Backup Location**: All backups are stored in `.file-backups/` directory
- **Retention**: Maximum 10 backups per file (oldest are automatically deleted)

### Backup Naming Convention
```
filename.YYYY-MM-DDTHH-MM-SS-sssZ.backup
```

Example: `package.json.2024-01-01T12-00-00-000Z.backup`

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message describing what went wrong",
  "type": "ErrorType"
}
```

Common errors:
- **Path traversal not allowed**: Attempting to access files outside project directory
- **File already exists**: Creating file that exists without `overwrite: true`
- **File does not exist**: Operating on non-existent file
- **File is protected**: Attempting to delete protected file without `force: true`
- **File size exceeds maximum**: File larger than 10MB limit
- **Access denied**: Attempting to read/write credential files for security reasons
- **Bulk operation limits**: Exceeding 50 files per bulk operation
- **Invalid bulk payload**: Missing required fields in bulk operation arrays

## Usage Examples

### Creating a Simple Text File
```javascript
const response = await fetch('http://localhost:3001/files/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'notes/readme.txt',
    content: 'This is a test file\nWith multiple lines'
  })
});

const result = await response.json();
console.log('File created:', result);
```

### Reading and Updating a File
```javascript
// Read the file
const readResponse = await fetch('http://localhost:3001/files/read', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filePath: 'notes/readme.txt' })
});

const fileData = await readResponse.json();
console.log('File content:', fileData.content);

// Update with new content
const updateResponse = await fetch('http://localhost:3001/files/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filePath: 'notes/readme.txt',
    content: fileData.content + '\nUpdated content!'
  })
});

const updateResult = await updateResponse.json();
console.log('File updated:', updateResult);
```

### Listing Project Files
```javascript
const listResponse = await fetch('http://localhost:3001/files/list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dirPath: '.',
    includeHidden: true,
    recursive: true
  })
});

const listing = await listResponse.json();
console.log(`Found ${listing.count} items:`);
listing.items.forEach(item => {
  console.log(`${item.isDirectory ? '📁' : '📄'} ${item.path} (${item.size} bytes)`);
});
```

## Best Practices

1. **Always handle errors**: Check response status and handle error responses
2. **Use appropriate endpoints**: Use `create` for new files, `update` for existing files
3. **Respect file protection**: Don't force delete protected files unless necessary
4. **Monitor backups**: Check backup directory size periodically
5. **Validate paths**: Use relative paths from project root
6. **Consider file sizes**: Large files may impact performance
7. **Use bulk operations**: For multiple files, use bulk endpoints to improve performance
8. **Handle partial failures**: In bulk operations, check both `results` and `errors` arrays
9. **Respect credential protection**: Don't attempt to access sensitive files
10. **Limit bulk operations**: Keep bulk operations under 50 files for optimal performance

## Security Considerations

1. **No External Access**: All file operations are restricted to the project directory
2. **Protected File List**: Critical files are automatically protected with backups
3. **Credential Protection**: Sensitive files are blocked from read/write operations
4. **Backup Safety**: Backups prevent accidental data loss
5. **Size Limits**: Prevents abuse with extremely large files
6. **Path Validation**: Prevents directory traversal attacks
7. **Bulk Operation Limits**: Maximum 50 files per operation prevents resource abuse
8. **Pattern-based Detection**: Uses multiple methods to identify sensitive files
9. **Default Security**: Credential files hidden from listings by default 