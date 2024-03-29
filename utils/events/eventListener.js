const eventListener = async (contractInstance, eventType, callbackFunction) => {
  contractInstance?.on(eventType, async (...args) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await callbackFunction(args[args.length - 1]);
    } catch (error) {
      throw error;
    }
  });
};

module.exports = {
  eventListener,
};
