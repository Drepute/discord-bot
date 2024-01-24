module.exports = (sequelize, DataTypes) => {
  const Participant = sequelize.define("Participant", {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joiningTime: { type: DataTypes.DATE, allowNull: true },
    leavingTime: { type: DataTypes.DATE, allowNull: true },
  });

  Participant.associate = function (models) {
    models.Event.belongsTo(models.Event);
  };

  return Participant;
};
