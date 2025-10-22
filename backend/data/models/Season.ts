import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Yurt from './Yurt';

@Table({
    tableName: 'Season',
    timestamps: false
})
export default class SeasonSequelize extends Model {
    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        primaryKey: true
    })
    declare season_year: string;

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
