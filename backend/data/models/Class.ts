import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'Class',
    timestamps: false
})
export default class ClassSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare class_name: string;
}
