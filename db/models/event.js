module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("Event", {
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  Event.associate = function (models) {
    models.Event.hasMany(models.Participant);
  };

  return Event;
};
