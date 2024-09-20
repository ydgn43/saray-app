import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'AttendanceType',
    timestamps: false
})
export default class AttendanceTypeSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare attendance_type_name: string;
}
