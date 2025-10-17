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
// backend/data/seedUsers.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: './config.env' });
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("./models/User"));
const sequelize_1 = require("./sequelize");
function createUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        // Connect to DB (if not already)
        yield sequelize_1.sequelize.sync();
        // Roles must exist beforehand. Make sure they are in your Role table.
        const roles = ['admin', 'hoca', 'yoklamaci'];
        // Example users
        const users = [
            {
                username: 'admin1',
                password: 'adminpass',
                role_name: 'admin'
            },
            {
                username: 'hoca1',
                password: 'hocapass',
                role_name: 'hoca'
            },
            {
                username: 'yoklamaci1',
                password: 'yoklamacipass',
                role_name: 'yoklamaci'
            }
        ];
        for (const user of users) {
            // Check if user already exists
            const exists = yield User_1.default.findOne({ where: { username: user.username } });
            if (exists) {
                console.log(`User ${user.username} already exists, skipping.`);
                continue;
            }
            // Hash the password
            const hashedPassword = yield bcrypt_1.default.hash(user.password, 10);
            // Create the user
            yield User_1.default.create({
                username: user.username,
                password: hashedPassword,
                role_name: user.role_name
            });
            console.log(`Created user: ${user.username}`);
        }
        process.exit(0);
    });
}
createUsers().catch((err) => {
    console.error(err);
    process.exit(1);
});
