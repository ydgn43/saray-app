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
// backend/data/models/AdminSignupRequest.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const Yurt_1 = __importDefault(require("./Yurt"));
let AdminSignupRequest = class AdminSignupRequest extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], AdminSignupRequest.prototype, "request_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(50)),
    __metadata("design:type", String)
], AdminSignupRequest.prototype, "username", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(255)),
    __metadata("design:type", String)
], AdminSignupRequest.prototype, "password_hash", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Yurt_1.default),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], AdminSignupRequest.prototype, "requested_yurtid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.ENUM('pending', 'approved', 'rejected')),
    __metadata("design:type", String)
], AdminSignupRequest.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], AdminSignupRequest.prototype, "requested_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], AdminSignupRequest.prototype, "reviewed_by", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], AdminSignupRequest.prototype, "reviewed_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], AdminSignupRequest.prototype, "notes", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Yurt_1.default),
    __metadata("design:type", Yurt_1.default)
], AdminSignupRequest.prototype, "yurt", void 0);
AdminSignupRequest = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'AdminSignupRequest',
        timestamps: false
    })
], AdminSignupRequest);
exports.default = AdminSignupRequest;
