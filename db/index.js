const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");

const sequelize = new Sequelize("test", "root", "test123", {
  host: "localhost",
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

// db.tutorials = require("./tutorial.model.js")(sequelize, Sequelize);

module.exports = db;
