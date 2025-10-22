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
const Season_1 = __importDefault(require("./Season"));
const Class_1 = __importDefault(require("./Class"));
let StudentSequelize = class StudentSequelize extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }),
    __metadata("design:type", Number)
], StudentSequelize.prototype, "studentid", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: false
    }),
    __metadata("design:type", String)
], StudentSequelize.prototype, "first_name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: true
    }),
    __metadata("design:type", Object)
], StudentSequelize.prototype, "last_name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
        allowNull: true
    }),
    __metadata("design:type", Object)
], StudentSequelize.prototype, "birth_date", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Season_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: false
    }),
    __metadata("design:type", String)
], StudentSequelize.prototype, "season_year", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Class_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(45),
        allowNull: false
    }),
    __metadata("design:type", String)
], StudentSequelize.prototype, "class_name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(20),
        allowNull: true,
        unique: true
    }),
    __metadata("design:type", Object)
], StudentSequelize.prototype, "reference_code", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Season_1.default),
    __metadata("design:type", Season_1.default)
], StudentSequelize.prototype, "season", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Class_1.default),
    __metadata("design:type", Class_1.default)
], StudentSequelize.prototype, "class", void 0);
StudentSequelize = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'Student',
        timestamps: false
    })
], StudentSequelize);
exports.default = StudentSequelize;
