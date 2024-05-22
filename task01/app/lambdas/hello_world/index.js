exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.parse(JSON.stringify('Hello from Lambda')),
    };
    return response;
};
