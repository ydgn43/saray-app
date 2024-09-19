import { Sequelize } from "sequelize-typescript";

export const sequelize = new Sequelize({
    database: process.env.SCHEMA_RELATIONAL_DB,
    dialect: 'mysql',
    username: process.env.USER_RELATIONAL_DB,
    password: process.env.PASSWORD_RELATIONAL_DB,
    models: ['./models'],
});