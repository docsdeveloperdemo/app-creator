"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("./middleware/cors"));
const logger_1 = __importDefault(require("./utils/logger"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use(cors_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
app.use('/api', routes_1.default);
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
app.use((err, req, res, next) => {
    logger_1.default.error(`Error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});
exports.default = app;
//# sourceMappingURL=app.js.map