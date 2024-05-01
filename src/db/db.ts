import mysql2, { PoolOptions } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "instagram"
};

const db = mysql2.createPool(poolConfig);

export default db;
