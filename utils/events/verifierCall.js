const { eventListener } = require("./eventListener");
const ethers = require("ethers");
const { managerAbi } = require("./abi/manager");
const { ALCHEMY_MATIC_MAINNET } = require("../../constants/api");
var axios = require("axios");
var qs = require("qs");

const polygonVerifierCall = async (proxyAddress) => {
  console.log("Contract Address", proxyAddress);
  const data = qs.stringify({
    module: "contract",
    action: "verifyproxycontract",
    apikey: "NWWHF4FZKKKKYZQ17KCMEH3SX5FUF4MBGE",
    address: proxyAddress,
  });
  const config = {
    method: "post",
    url: "https://api.polygonscan.com/api",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };
  console.log("configs", config);
  axios(config)
    .then(function (response) {
      console.log("results", JSON.stringify(response.data));
      return JSON.stringify(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
};

const proxyContractVerifier = () => {
  const managerInstance = new ethers.Contract(
    "0xDA6F4387C344f1312439E05E9f9580882abA6958",
    managerAbi,
    new ethers.providers.JsonRpcProvider(ALCHEMY_MATIC_MAINNET)
  );
  eventListener(
    managerInstance,
    "ProxyDeployed",
    async (x) => await polygonVerifierCall(x.args[0])
  );
};

module.exports = {
  proxyContractVerifier,
  polygonVerifierCall,
};
