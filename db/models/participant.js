module.exports = (sequelize, DataTypes) => {
  const Participant = sequelize.define("Participant", {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    joiningTime: DataTypes.DATE,
    leavingTime: DataTypes.DATE,
  });

  return Participant;
};
