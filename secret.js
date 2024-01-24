const AWS = require("aws-sdk");

const getSecretValue = async (secretName) => {
  var client = new AWS.SecretsManager({ region: "us-east-1" });

  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, function (err, data) {
      if (err) {
        reject(err);
      } else {
        let secret;
        if ("SecretString" in data) {
          secret = data.SecretString;
        } else {
          let buff = new Buffer(data.SecretBinary, "base64");
          secret = buff.toString("ascii");
        }
        resolve(JSON.parse(secret));
      }
    });
  });
};

module.exports = {
  getSecretValue,
};
