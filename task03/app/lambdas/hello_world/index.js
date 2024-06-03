exports.handler = async (event) => {
    // TODO implement
    var responseJson = {
          statusCode: 200,
          message: JSON.parse(JSON.stringify('Hello from Lambda')),
      };

    return responseJson;
};
