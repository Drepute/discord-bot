require("dotenv").config();
const api = require("../constants/api");
const apiClient = require("./apiClient");

// const removeMapping = async (guildId) => {
//   try {
//     const res = await apiClient.post(
//       `${api.BASE_URL}${api.ROUTES.isUserVerified}?guild_id=${guildId}&discord_user_id=${userId}`,
//       {
//         guild_id: guildId,
//       }
//     );
//     console.log("Successfully removed mapping");
//     return true;
//   } catch (error) {
//     console.error(error);
//     return false;
//   }
// };

const getDao = async (guildId) => {
  let data;
  try {
    const res = await apiClient.get(
      `${api.BASE_URL}${api.ROUTES.daoWithGuild}?guild_id=${guildId}`
    );

    if (res.data.success) {
      data = res.data.data;
    } else {
      throw new Error(JSON.stringify(res.data.errors));
    }
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
  }

  return data;
};

const getBadgeTypes = async (daoUuid) => {
  let data = [];
  try {
    const res = await apiClient.get(
      `${api.BASE_URL}${api.ROUTES.getBadgeTypes}?dao_uuid=${daoUuid}`
    );

    if (res.data.success) {
      data = res.data.data.data;
    } else {
      throw new Error(JSON.stringify(res.data.errors));
    }
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
  }

  return data;
};

const getBadgeVoucherCreationInfo = async (discordIdArr, contractAddress) => {
  let data;
  try {
    const res = await apiClient.post(
      `${api.BASE_URL}${api.ROUTES.badgeVoucherCreationInfo}`,
      {
        discord_id_arr: discordIdArr,
        contract_address: contractAddress,
      }
    );

    if (res.data.success) {
      data = res.data.data;
    } else {
      throw new Error(JSON.stringify(res.data.errors));
    }
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
  }

  return data;
};

const getAllDiscords = async () => {
  let response = { data: null, error: null };
  try {
    const res = await apiClient.get(`${api.BASE_URL}${api.ROUTES.discord}`);

    if (res.data.success) {
      response.data = res.data.data;
    } else {
      throw new Error(JSON.stringify(res.data.errors));
    }
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
    response.error = error;
  }

  return response;
};

const createBadgeVoucher = async (reqBody) => {
  let data;
  try {
    const res = await apiClient.post(
      `${api.BASE_URL}${api.ROUTES.createBadgeVoucher}`,
      reqBody
    );

    if (res.data.success) {
      data = res.data.data.data;
    } else {
      throw new Error(JSON.stringify(res.data.errors));
    }
  } catch (error) {
    let err;
    if (error.response) {
      // Request made and server responded
      err = `data:${JSON.stringify(error.response.data)}, status:${
        error.response.status
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      err = `error.request: ${error.request}`;
    } else {
      // Something happened in setting up the request that triggered an Error
      err = `error.message: ${error.message}`;
    }
    console.error(err);
  }

  return data;
};

module.exports = {
  getBadgeTypes,
  getDao,
  getBadgeVoucherCreationInfo,
  getAllDiscords,
  createBadgeVoucher,
};
