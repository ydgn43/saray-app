"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const Role_1 = __importDefault(require("./Role"));
const Student_1 = __importDefault(require("./Student"));
const Yurt_1 = __importDefault(require("./Yurt"));
let UserSequelize = class UserSequelize extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }),
    __metadata("design:type", Number)
], UserSequelize.prototype, "accountid", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Yurt_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    }),
    __metadata("design:type", Number)
], UserSequelize.prototype, "yurtid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: false
    }),
    __metadata("design:type", String)
], UserSequelize.prototype, "username", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false
    }),
    __metadata("design:type", String)
], UserSequelize.prototype, "password", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Role_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: false
    }),
    __metadata("design:type", String)
], UserSequelize.prototype, "role_name", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Student_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true
    }),
    __metadata("design:type", Object)
], UserSequelize.prototype, "studentid", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Role_1.default),
    __metadata("design:type", Role_1.default)
], UserSequelize.prototype, "role", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Student_1.default),
    __metadata("design:type", Student_1.default)
], UserSequelize.prototype, "student", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Yurt_1.default),
    __metadata("design:type", Yurt_1.default)
], UserSequelize.prototype, "yurt", void 0);
UserSequelize = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'user',
        timestamps: false
    })
], UserSequelize);
exports.default = UserSequelize;
