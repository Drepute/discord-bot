require("dotenv").config();
const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");

const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
});

const db = {};

console.log("path is", path.join(__dirname, "models"));

fs.readdirSync(path.join(__dirname, "models")).forEach((file) => {
  console.log(
    "file is ",
    file,
    path.join(path.join(__dirname, "models"), file)
  );
  const model = require(path.join(path.join(__dirname, "models"), file))(
    sequelize,
    Sequelize.DataTypes
  );
  db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
