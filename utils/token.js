let token = null;

const updateToken = (newToken) => {
  token = newToken;
};

const getToken = () => {
  return token;
};

const methods = {
  updateToken,
  getToken,
};
module.exports = methods;
