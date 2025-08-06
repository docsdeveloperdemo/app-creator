"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.get('/health', controllers_1.healthCheck);
router.get('/', (req, res) => {
    res.json({
        message: 'Express App Creator API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            docs: '/api/docs'
        }
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map