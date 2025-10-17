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
const cors_1 = __importDefault(require("cors"));
const sequelize_1 = require("./data/sequelize");
const studentRoute_1 = require("./routes/studentRoute");
const attendanceRoute_1 = require("./routes/attendanceRoute");
const userRoute_1 = require("./routes/userRoute");
const authRoute_1 = require("./routes/authRoute");
const seasonRoute_1 = require("./routes/seasonRoute");
const programRoute_1 = require("./routes/programRoute");
const classRoute_1 = require("./routes/classRoute");
const app = (0, express_1.default)();
const port = process.env.PORT_HTTP || 3001;
// ✅ allow both local dev and production via Cloudflare
const allowedOrigins = [
    'http://localhost:3000',
    'https://app.efendim.nl',
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true); // allow tools like curl or Postman
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('CORS not allowed for ' + origin), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// ✅ routes go AFTER CORS
app.use('/student', studentRoute_1.studentRouter);
app.use('/attendance', attendanceRoute_1.attendanceRouter);
app.use('/user', userRoute_1.userRouter);
app.use('/auth', authRoute_1.authRouter);
app.use('/season', seasonRoute_1.seasonRouter);
app.use('/program', programRoute_1.programRouter);
app.use('/class', classRoute_1.classRouter);
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
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
