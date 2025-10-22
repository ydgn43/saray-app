import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'ActivityLog',
    timestamps: false
})
export default class ActivityLog extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    })
    declare logid: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare userid: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare username: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false
    })
    declare action: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false
    })
    declare entity_type: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    declare entity_id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare details: string | null;

    @Column({
        type: DataType.STRING(50),
        allowNull: true
    })
    declare ip_address: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    declare created_at: Date;
}
