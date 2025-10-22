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
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
let ReferenceCode = class ReferenceCode extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }),
    __metadata("design:type", Number)
], ReferenceCode.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique reference code for signup'
    }),
    __metadata("design:type", String)
], ReferenceCode.prototype, "code", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: false,
        field: 'role_name',
        comment: 'Role name to be assigned when code is used'
    }),
    __metadata("design:type", String)
], ReferenceCode.prototype, "roleId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        comment: 'Admin user who created this code'
    }),
    __metadata("design:type", Number)
], ReferenceCode.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
        comment: 'Expiration date for the reference code'
    }),
    __metadata("design:type", Date)
], ReferenceCode.prototype, "expiresAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the code has been fully used'
    }),
    __metadata("design:type", Boolean)
], ReferenceCode.prototype, "isUsed", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
        comment: 'User who used this code (for single-use codes)'
    }),
    __metadata("design:type", Number)
], ReferenceCode.prototype, "usedBy", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
        comment: 'When the code was first/last used'
    }),
    __metadata("design:type", Date)
], ReferenceCode.prototype, "usedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 1,
        comment: 'Maximum number of times this code can be used'
    }),
    __metadata("design:type", Number)
], ReferenceCode.prototype, "maxUses", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
        comment: 'Current number of times this code has been used'
    }),
    __metadata("design:type", Number)
], ReferenceCode.prototype, "currentUses", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
        comment: 'Optional description for the reference code'
    }),
    __metadata("design:type", String)
], ReferenceCode.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
        comment: 'Yurt ID that this reference code belongs to'
    }),
    __metadata("design:type", Number)
], ReferenceCode.prototype, "yurtid", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], ReferenceCode.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], ReferenceCode.prototype, "updatedAt", void 0);
ReferenceCode = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'referencecodes',
        timestamps: true
    })
], ReferenceCode);
exports.default = ReferenceCode;
