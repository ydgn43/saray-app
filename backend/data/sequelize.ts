import path from "path";
import { Sequelize } from "sequelize-typescript";

console.log('SCHEMA_RELATIONAL_DB:', process.env.SCHEMA_RELATIONAL_DB);
console.log('USER_RELATIONAL_DB:', process.env.USER_RELATIONAL_DB);
console.log('PASSWORD_RELATIONAL_DB:', process.env.PASSWORD_RELATIONAL_DB);
console.log('HOST_RELATIONAL_DB:', process.env.HOST_RELATIONAL_DB);

export const sequelize = new Sequelize({
    database: process.env.SCHEMA_RELATIONAL_DB,
    dialect: 'mysql',
    host: process.env.HOST_RELATIONAL_DB || '127.0.0.1',
    username: process.env.USER_RELATIONAL_DB,
    password: process.env.PASSWORD_RELATIONAL_DB,
    models: [path.join(__dirname, './models')],
    dialectOptions: {
        connectTimeout: 10000, // optional, prevents quick timeouts
    },
});
