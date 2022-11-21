const Web3 = require("web3");
const Provider = require("@truffle/hdwallet-provider");
const fetch = require("node-fetch");
const {
  buildForwardTxRequest,
  getDomainSeperator,
  getDataToSignForEIP712,
  getBiconomyForwarderConfig,
  getTransactionReceiptMined,
  routerAbi,
  pocpAbi,
} = require("./helper");

const sendTransaction = async ({
  userAddress,
  request,
  sig,
  domainSeparator,
  signatureType,
  apiKey,
  apiId,
  to,
  web3,
}) => {
  let params;
  if (domainSeparator) {
    params = [request, domainSeparator, sig];
  } else {
    params = [request, sig];
  }
  console.log("sig", sig);
  try {
    fetch(`https://api.biconomy.io/api/v2/meta-tx/native`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        to,
        apiId: apiId,
        params: params,
        from: userAddress,
        signatureType,
        gasLimit: Web3.utils.toHex(1e7),
      }),
    })
      .then((response) => response.json())
      .then(async function (result) {
        console.log(result);
        const receipt = await getTransactionReceiptMined(
          web3,
          result.txHash,
          2000
        );
        console.log("receipt", receipt);
        try {
          if (receipt?.logs.lengths === 4) {
            return { status: true, response: receipt };
          }

          return { status: false, response: receipt };
        } catch (error) {
          console.error("[sendTransaction][receipt] ERROR", error);
          return { status: false, response: error };
        }
      })
      .catch(function (error) {
        console.error("[sendTransaction] ERROR", error);
        return { status: false, response: error };
      });
  } catch (error) {
    console.error("[sendTransaction][Fetch] ERROR", error);
    return { status: false, response: error };
  }
};

const directMintTxFnc = async (
  userAddress,
  networkId,
  routerAddress,
  pocpProxyAddress,
  arrayOfMemberTokenId,
  arrayOfType,
  arrayOfData,
  arrayOfTokenUri,
  apiKey,
  apiId,
  privKey,
  rpcUrl
) => {
  const web3 = new Web3(new Provider(privKey, rpcUrl));
  let contract = new web3.eth.Contract(routerAbi, routerAddress);
  const proxyContract = new web3.eth.Contract(pocpAbi, pocpProxyAddress);
  let functionSignature = contract.methods
    .routeRequest({
      to: pocpProxyAddress,
      gas: 1e7,
      value: 0,
      data: proxyContract.methods
        .batchIssueBadge(
          arrayOfMemberTokenId,
          arrayOfType,
          arrayOfData,
          `${arrayOfTokenUri.toString()},`
        )
        .encodeABI(),
    })
    .encodeABI();

  let txGas = await contract.methods
    .routeRequest({
      to: pocpProxyAddress,
      gas: 1e7,
      value: 0,
      data: proxyContract.methods
        .batchIssueBadge(
          arrayOfMemberTokenId,
          arrayOfType,
          arrayOfData,
          `${arrayOfTokenUri.toString()},`
        )
        .encodeABI(),
    })
    .estimateGas({ from: userAddress });

  let forwarder = await getBiconomyForwarderConfig(networkId);

  let forwarderContract = new web3.eth.Contract(
    forwarder.abi,
    forwarder.address
  );

  const batchNonce = await forwarderContract.methods
    .getNonce(userAddress, 0)
    .call();
  console.log(batchNonce);
  const gasLimitNum = Number(txGas);
  const to = routerAddress;

  const request = await buildForwardTxRequest({
    account: userAddress,
    to,
    gasLimitNum,
    batchId: 0,
    batchNonce,
    data: functionSignature,
  });

  const domainSeparator = await getDomainSeperator(networkId);

  const dataToSign = await getDataToSignForEIP712(request, networkId);

  web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      id: 999999999999,
      method: "eth_signTypedData_v4",
      params: [userAddress, dataToSign],
    },
    async function (error, response) {
      console.info(`User signature is ${response.result}`);
      if (error || (response && response.error)) {
        return { status: true, response: error || response?.error };
      } else if (response && response.result) {
        let sig = response.result;
        await sendTransaction({
          web3,
          userAddress,
          request,
          domainSeparator,
          sig,
          signatureType: "EIP712_SIGN",
          apiKey,
          apiId,
        });
      }
    }
  );
};

module.exports = {
  sendTransaction,
  directMintTxFnc,
};
