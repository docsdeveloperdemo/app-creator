const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'A-Frame VR server is running' });
});

// Serve index.html for root and any unmatched routes
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Index file not found at ' + indexPath);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 A-Frame VR Experience Server Started!');
    console.log('========================================');
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log('');
    console.log('🎮 Controls:');
    console.log('   • Press "i" for info panel');
    console.log('   • Press "f" for fullscreen');
    console.log('   • Press "r" to reset camera');
    console.log('   • Press SPACE to jump');
    console.log('');
    console.log('✨ Ready for VR/AR experiences!');
    console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
