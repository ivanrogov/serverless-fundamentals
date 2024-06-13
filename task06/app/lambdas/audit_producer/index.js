const AWS = require("aws-sdk");
const uuid = require("uuid");
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    var audit = {};
    var newVal = {};
    var params = {};
    var record = event.Records[0];
    const timestampNumber = Number(record.dynamodb.ApproximateCreationDateTime);
    if (record.eventName == 'INSERT'){
        newVal = {
          "key": record.dynamodb.NewImage.key.S,
          "value": record.dynamodb.NewImage.value.N
        };
        audit = {
          "id": uuid.v4(),
          "itemKey": record.dynamodb.Keys.key.S,
          "modificationTime": new Date(timestampNumber*1000).toISOString(),
          "newValue": newVal
        }
    }
    if (record.eventName == 'MODIFY'){
        audit = {
          "id": uuid.v4(),
          "itemKey": record.dynamodb.Keys.key.S,
          "modificationTime": new Date(timestampNumber*1000).toISOString(),
          "updatedAttribute": "value",
          "oldValue": record.dynamodb.OldImage.value.N,
          "newValue": record.dynamodb.NewImage.value.N
        }
    }
    params = {
        TableName: "cmtr-a3f8c244-Audit",
        Item: audit
    };

    console.log(JSON.stringify(params));
    try {
        const data = await docClient.put(params).promise();
        console.log(data);
    } catch (error) {
        console.log(error);
    }
};
