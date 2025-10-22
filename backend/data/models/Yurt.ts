import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'Yurt',
    timestamps: false
})
export default class YurtSequelize extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    })
    declare yurtid: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        unique: true
    })
    declare yurt_name: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    declare description: string | null;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare location: string | null;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    declare is_active: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare created_at: Date;
}
