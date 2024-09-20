import { Table, Column, Model, DataType } from 'sequelize-typescript';

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
}
