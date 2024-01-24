const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

const checkInternalToken = (req) => {
  return req.headers["x-authentication"] === INTERNAL_TOKEN;
};

module.exports = { checkInternalToken };
