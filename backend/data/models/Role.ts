import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'Role',
    timestamps: false
})
export default class RoleSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare role_name: string;
}
