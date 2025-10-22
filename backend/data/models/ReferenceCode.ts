import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
    tableName: 'referencecodes',
    timestamps: true
})
export default class ReferenceCode extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique reference code for signup'
    })
    declare code: string;

    @Column({
        type: DataType.STRING(45),
        allowNull: false,
        field: 'role_name',
        comment: 'Role name to be assigned when code is used'
    })
    declare roleId: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'Admin user who created this code'
    })
    declare createdBy: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        comment: 'Expiration date for the reference code'
    })
    declare expiresAt: Date;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the code has been fully used'
    })
    declare isUsed: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'User who used this code (for single-use codes)'
    })
    declare usedBy?: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        comment: 'When the code was first/last used'
    })
    declare usedAt?: Date;

    @Column({
        type: DataType.INTEGER,
        defaultValue: 1,
        comment: 'Maximum number of times this code can be used'
    })
    declare maxUses: number;

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
        comment: 'Current number of times this code has been used'
    })
    declare currentUses: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        comment: 'Optional description for the reference code'
    })
    declare description?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'Yurt ID that this reference code belongs to'
    })
    declare yurtid?: number;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}
