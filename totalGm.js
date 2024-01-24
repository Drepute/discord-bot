let numberOfGm = 0;
let specifiedChannelId = null;

const getNumberOfGm = () => {
  return numberOfGm;
};

const addGm = () => {
  numberOfGm += 1;
};

const setSpecifiedChannel = (channelId) => {
  specifiedChannelId = channelId;
};

const getSpecifiedChannel = () => {
  return specifiedChannelId;
};

module.exports = {
  getNumberOfGm,
  addGm,
  setSpecifiedChannel,
  getSpecifiedChannel,
};
