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
  reqBody,
  postDirectMint,
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
          if (receipt?.logs.length === 4) {
            const badge = await postDirectMint(reqBody);

            if (!badge) {
              console.error(
                `[postEventProcess][directMint] Could not create badge using directMint in the backend`
              );
              return null;
            }
            console.info("badge", badge);
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
  rpcUrl,
  reqBody,
  postDirectMint
) => {
  const web3 = new Web3(new Provider(privKey, rpcUrl));
  let contract = new web3.eth.Contract(routerAbi, routerAddress);
  console.log("contract", contract);
  const proxyContract = new web3.eth.Contract(pocpAbi, pocpProxyAddress);
  console.log("proxyContract", proxyContract);
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

  console.log("functionSignature", functionSignature);

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

  console.log("txGas", txGas);

  let forwarder = await getBiconomyForwarderConfig(networkId);

  console.log("forwarder", forwarder);

  let forwarderContract = new web3.eth.Contract(
    forwarder.abi,
    forwarder.address
  );

  console.log("forwarderContract", forwarderContract);

  const batchNonce = await forwarderContract.methods
    .getNonce(userAddress, 0)
    .call();
  console.log("batchNonce", batchNonce);
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

  console.log("request", request);

  const domainSeparator = await getDomainSeperator(networkId);

  console.log("domainSeparator", domainSeparator);

  const dataToSign = await getDataToSignForEIP712(request, networkId);

  console.log("dataToSign", dataToSign);

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
        console.error("error", error || response?.error);
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
          reqBody,
          postDirectMint,
        });
      }
    }
  );
};

module.exports = {
  sendTransaction,
  directMintTxFnc,
};
