import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Yurt from './Yurt';

@Table({
    tableName: 'program',
    timestamps: false
})
export default class ProgramSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare program_name: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    declare display_name: string | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: 0
    })
    declare display_order: number | null;

    @ForeignKey(() => Yurt)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    declare yurtid: number;

    @BelongsTo(() => Yurt)
    yurt!: Yurt;
}
