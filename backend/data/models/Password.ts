import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import User from './User';

@Table({
    tableName: 'Password',
    timestamps: false
})
export default class PasswordSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false
    })
    declare password: string;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare creation_date: Date;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare accountid: number;
}
