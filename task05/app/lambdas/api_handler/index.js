const AWS = require("aws-sdk");
const uuid = require("uuid");

const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const convertedEvent = {
      "id": uuid.v4(),
      "principalId": event.principalId,
      "createdAt": new Date().toISOString(),
      "body": event.content
    }
    const params = {
        TableName: "cmtr-a3f8c244-Events-test",
        Item: convertedEvent
    };

    try {
        const data = await docClient.put(params).promise();
        return {statusCode: 201, event: JSON.parse(JSON.stringify(convertedEvent))};
    } catch (error) {
        console.log(error);
        return {statusCode: 500, body: JSON.stringify('An error occurred')};
    }
};