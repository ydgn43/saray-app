import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Role from './Role';
import Student from './Student';
import Yurt from './Yurt';

@Table({
    tableName: 'user',
    timestamps: false
})
export default class UserSequelize extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    })
    declare accountid: number;

    @ForeignKey(() => Yurt)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare yurtid: number;

    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare username: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false
    })
    declare password: string;

    @ForeignKey(() => Role)
    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare role_name: string;

    @ForeignKey(() => Student)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare studentid: number | null;

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare resetToken: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare resetTokenExpiry: Date | null;

    @BelongsTo(() => Role)
    role!: Role;

    @BelongsTo(() => Student)
    student?: Student;

    @BelongsTo(() => Yurt)
    yurt!: Yurt;
}
