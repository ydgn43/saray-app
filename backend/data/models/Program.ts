import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'Program',
    timestamps: false
})
export default class ProgramSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare program_name: string;
}
