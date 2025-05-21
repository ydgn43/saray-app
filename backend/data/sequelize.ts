import path from "path";
import { Sequelize } from "sequelize-typescript";

console.log('SCHEMA_RELATIONAL_DB:', process.env.SCHEMA_RELATIONAL_DB);
console.log('USER_RELATIONAL_DB:', process.env.USER_RELATIONAL_DB);
console.log('PASSWORD_RELATIONAL_DB:', process.env.PASSWORD_RELATIONAL_DB);


export const sequelize = new Sequelize({
    database: process.env.SCHEMA_RELATIONAL_DB,
    dialect: 'mysql',
    username: process.env.USER_RELATIONAL_DB,
    //username: 'root',
    password: process.env.PASSWORD_RELATIONAL_DB,
    models: [path.join(__dirname, './models')],
});