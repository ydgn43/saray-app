// backend/data/models/AdminSignupRequest.ts
import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import User from './User';
import Yurt from './Yurt';

@Table({
    tableName: 'adminsignuprequest',
    timestamps: false
})
export default class AdminSignupRequest extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    request_id!: number;

    @Column(DataType.STRING(50))
    username!: string;

    @Column(DataType.STRING(255))
    password_hash!: string;

    @ForeignKey(() => Yurt)
    @Column(DataType.INTEGER)
    requested_yurtid!: number;

    @Column(DataType.ENUM('pending', 'approved', 'rejected'))
    status!: 'pending' | 'approved' | 'rejected';

    @Column(DataType.DATE)
    requested_at!: Date;

    @Column(DataType.INTEGER)
    reviewed_by?: number;

    @Column(DataType.DATE)
    reviewed_at?: Date;

    @Column(DataType.TEXT)
    notes?: string;

    @BelongsTo(() => Yurt)
    yurt!: Yurt;
}
