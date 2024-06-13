const AWS = require('aws-sdk');
const uuid = require('uuid');

const s3 = new AWS.S3();

exports.handler = async (event) => {
    const bucketName = 'cmtr-a3f8c244-uuid-storage-test';
    let uids = new Array(10).fill(0).map(() => uuid.v4());

    const dataObject = {
        "ids": uids
    };

    const params = {
        Bucket: bucketName,
        Key: `${new Date().toISOString()}`,
        Body: JSON.stringify(dataObject),
        ContentType: 'application/json'
    };

    try {
        const data = await s3.upload(params).promise();
        const response = {
            statusCode: 200,
            body: JSON.stringify(`File uploaded successfully at ${data.Location}`),
        };
        return response;
   } catch (e) {
        console.log('Error', e);
        const response = {
            statusCode: 500,
            body: JSON.stringify('An error occurred while uploading the file.'),
        };
        return response;
    }
};
