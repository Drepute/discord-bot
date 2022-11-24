const { eventListener } = require("./eventListener");
const ethers = require("ethers");
const { managerAbi } = require("./abi/manager");
const {
  ALCHEMY_MATIC_MAINNET,
  POLYGON_API_KEY,
} = require("../../constants/api");
var axios = require("axios");
var qs = require("qs");
const { getSecretValue } = require("../../secret");

const polygonVerifierCall = async (proxyAddress) => {
  const data = qs.stringify({
    module: "contract",
    action: "verifyproxycontract",
    apikey: POLYGON_API_KEY,
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

  axios(config)
    .then(function (response) {
      return JSON.stringify(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
};

const proxyContractVerifier = () => {
    const rpcCreds = await getSecretValue("rpc_urls");
const ALCHEMY_MATIC_MAINNET = rpcCreds["ALCHEMY_POLYGON_MAIN"];
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
