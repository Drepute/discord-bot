module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return User;
};
