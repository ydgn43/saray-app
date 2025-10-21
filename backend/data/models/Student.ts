import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Season from './Season';
import Class from './Class';

@Table({
    tableName: 'Student',
    timestamps: false
})
export default class StudentSequelize extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    })
    declare studentid: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare first_name: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: true
    })
    declare last_name: string | null;

    @Column({
        type: DataType.DATEONLY,
        allowNull: true
    })
    declare birth_date: Date | null;

    @ForeignKey(() => Season)
    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare season_year: string;

    @ForeignKey(() => Class)
    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare class_name: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: true,
        unique: true
    })
    declare reference_code: string | null;

    @BelongsTo(() => Season)
    season!: Season;

    @BelongsTo(() => Class)
    class!: Class;
}
