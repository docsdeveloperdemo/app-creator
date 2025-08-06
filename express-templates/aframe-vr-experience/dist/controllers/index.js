"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.healthCheck = void 0;
const healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
};
exports.healthCheck = healthCheck;
const notFound = (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
};
exports.notFound = notFound;
//# sourceMappingURL=index.js.map