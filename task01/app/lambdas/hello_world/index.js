exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        message: JSON.parse(JSON.stringify('Hello from Lambda')),
    };
    return response;
};
