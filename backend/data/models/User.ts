import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Role from './Role';

@Table({
    tableName: 'User',
    timestamps: false
})
export default class UserSequelize extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    })
    declare accountid: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare username: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare password: string;

    @ForeignKey(() => Role)
    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare role_name: string;

    @BelongsTo(() => Role)
    role!: Role;
}
