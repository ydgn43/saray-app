// backend/data/models/UserYurt.ts
import { Table, Column, Model, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import User from './User';
import Yurt from './Yurt';

@Table({
    tableName: 'useryurt',
    timestamps: false
})
export default class UserYurt extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    user_yurt_id!: number;

    @ForeignKey(() => User)
    @Column(DataType.INTEGER)
    accountid!: number;

    @ForeignKey(() => Yurt)
    @Column(DataType.INTEGER)
    yurtid!: number;

    @Column(DataType.BOOLEAN)
    is_primary!: boolean;

    @Column(DataType.INTEGER)
    assigned_by?: number;

    @Column(DataType.DATE)
    assigned_at!: Date;

    @BelongsTo(() => User, 'accountid')
    user!: User;

    @BelongsTo(() => Yurt)
    yurt!: Yurt;
}
