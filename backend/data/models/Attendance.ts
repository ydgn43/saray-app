import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Student from './Student';
import AttendanceType from './AttendanceType';
import Program from './Program';
import Yurt from './Yurt';

@Table({
    tableName: 'Attendance',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['studentid', 'date', 'program_name'],
        },
    ],
})
export default class AttendanceSequelize extends Model {
    @ForeignKey(() => Student)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
    })
    declare studentid: number;

    @ForeignKey(() => Yurt)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare yurtid: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
        primaryKey: true,
    })
    declare date: Date;

    @ForeignKey(() => AttendanceType)
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
    })
    declare attendance_type_name: string;

    @ForeignKey(() => Program)
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true,
    })
    declare program_name: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    declare sebep: string | null;

    @BelongsTo(() => Student)
    student!: Student;

    @BelongsTo(() => AttendanceType)
    attendanceType!: AttendanceType;

    @BelongsTo(() => Program)
    program!: Program;

    @BelongsTo(() => Yurt)
    yurt!: Yurt;
}
