"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const path_1 = __importDefault(require("path"));
const sequelize_typescript_1 = require("sequelize-typescript");
console.log('SCHEMA_RELATIONAL_DB:', process.env.SCHEMA_RELATIONAL_DB);
console.log('USER_RELATIONAL_DB:', process.env.USER_RELATIONAL_DB);
console.log('PASSWORD_RELATIONAL_DB:', process.env.PASSWORD_RELATIONAL_DB);
console.log('HOST_RELATIONAL_DB:', process.env.HOST_RELATIONAL_DB);
exports.sequelize = new sequelize_typescript_1.Sequelize({
    database: process.env.SCHEMA_RELATIONAL_DB,
    dialect: 'mysql',
    host: process.env.HOST_RELATIONAL_DB || '127.0.0.1',
    username: process.env.USER_RELATIONAL_DB,
    password: process.env.PASSWORD_RELATIONAL_DB,
    models: [path_1.default.join(__dirname, './models')],
    dialectOptions: {
        connectTimeout: 10000, // optional, prevents quick timeouts
    },
});
