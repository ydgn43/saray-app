"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './config.env' });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const sequelize_1 = require("./data/sequelize");
const studentRoute_1 = require("./routes/studentRoute");
const attendanceRoute_1 = require("./routes/attendanceRoute");
const userRoute_1 = require("./routes/userRoute");
const authRoute_1 = require("./routes/authRoute");
const seasonRoute_1 = require("./routes/seasonRoute");
const programRoute_1 = require("./routes/programRoute");
const classRoute_1 = require("./routes/classRoute");
const referenceCodeRoute_1 = __importDefault(require("./routes/referenceCodeRoute"));
const activityLogRoute_1 = require("./routes/activityLogRoute");
const yurtRoute_1 = __importDefault(require("./routes/yurtRoute"));
const yurtManagementRoute_1 = __importDefault(require("./routes/yurtManagementRoute"));
const superAdminRoute_1 = __importDefault(require("./routes/superAdminRoute"));
const socketServer_1 = require("./websocket/socketServer");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = Number(process.env.PORT_HTTP) || 3001;
const host = '0.0.0.0';
// Define the whitelist of allowed frontend origins
const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.50.238:3000",
    "https://app.efendim.nl",
    "https://api.efendim.nl"
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true); // allow REST tools like Postman
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        console.error("❌ CORS blocked for", origin);
        return callback(new Error("CORS not allowed for " + origin), false);
    },
    credentials: true,
    exposedHeaders: ['X-Yurt-Id'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Yurt-Id']
}));
// ⛔️ REMOVED THE app.options('*') BLOCK HERE! 
// The 'cors' middleware above handles preflight requests correctly.
app.use(express_1.default.json());
// 2. Routes go AFTER the CORS middleware
app.use('/student', studentRoute_1.studentRouter);
app.use('/attendance', attendanceRoute_1.attendanceRouter);
app.use('/user', userRoute_1.userRouter);
app.use('/auth', authRoute_1.authRouter);
app.use('/season', seasonRoute_1.seasonRouter);
app.use('/program', programRoute_1.programRouter);
app.use('/class', classRoute_1.classRouter);
app.use('/reference-codes', referenceCodeRoute_1.default);
app.use('/activity-logs', activityLogRoute_1.activityLogRouter);
app.use('/yurts', yurtRoute_1.default);
app.use('/yurt-management', yurtManagementRoute_1.default);
app.use('/super-admin', superAdminRoute_1.default);
// Health check endpoint
app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize_1.sequelize.authenticate();
        const User = sequelize_1.sequelize.models.UserSequelize;
        const userCount = yield User.count();
        res.json({
            status: 'OK',
            database: 'Connected',
            userCount: userCount,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
console.log('✅ All routes registered successfully!');
console.log('📍 Auth routes: POST /auth/login, POST /auth/signup');
// Catch-all for debugging 404s
app.use((req, res, next) => {
    console.log(`⚠️  404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found', path: req.url, method: req.method });
});
// Initialize WebSocket server
(0, socketServer_1.initializeWebSocket)(httpServer);
httpServer.listen(port, host, () => {
    console.log(`🚀 Backend server listening on http://${host}:${port}`);
    console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`🔌 WebSocket server initialized`);
});
function testSequelizeConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield sequelize_1.sequelize.authenticate();
            console.log('Connection established successfully.');
        }
        catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    });
}
testSequelizeConnection();
