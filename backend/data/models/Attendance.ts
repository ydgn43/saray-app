import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Student from './Student';
import AttendanceType from './AttendanceType';
import Program from './Program';

@Table({
    tableName: 'Attendance',
    timestamps: false
})
export default class AttendanceSequelize extends Model {
    @ForeignKey(() => Student)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true
    })
    declare studentid: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
        primaryKey: true
    })
    declare date: Date;

    @ForeignKey(() => AttendanceType)
    @Column({
        type: DataType.STRING(45),
        allowNull: true
    })
    declare attendance_type_name: string;

    @ForeignKey(() => Program)
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare program_name: string;

    @BelongsTo(() => Student)
    student!: Student;

    @BelongsTo(() => AttendanceType)
    attendanceType!: AttendanceType;

    @BelongsTo(() => Program)
    program!: Program;
}
