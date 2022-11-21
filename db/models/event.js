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
    contractAddress: {
      type: DataTypes.STRING,
      allowNull: true,
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
    participantThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    badgeTokenType: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    badgeMetadataHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    badgeCollectionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    badgeTypeName: {
      type: DataTypes.STRING,
      allowNull: false,
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
