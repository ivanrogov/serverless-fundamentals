const AWS = require("aws-sdk");
const axios = require('axios');
const {v4: uuidv4} = require('uuid');

exports.handler = async (event) => {
  var docClient = new AWS.DynamoDB.DocumentClient({region: "eu-central-1"});

  const response = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m');
  const data = response.data;

  // generate a uuid
  const id = uuidv4();

  const params = {
      TableName : 'cmtr-a3f8c244-Weather-test',
      Item : {
           "id": id,
           "forecast": {
               "elevation": data.elevation,
               "generationtime_ms": data.generationtime_ms,
               "hourly": {
                    "temperature_2m": data.hourly.temperature_2m,
                    "time": data.hourly.time
               },
               "hourly_units": {
                    "temperature_2m": data.hourly_units.temperature_2m,
                    "time": data.hourly_units.time
               }        ,
               "latitude": data.latitude,
               "longitude": data.longitude,
               "timezone": data.timezone,
               "timezone_abbreviation": data.timezone_abbreviation,
               "utc_offset_seconds": data.utc_offset_seconds
           }
      }
  };

  console.log(params);

    try {
        await docClient.put(params).promise();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params.Item),
        };
    } catch (err) {
        console.error(`Unable to add item. Error JSON: ${JSON.stringify(err, null, 2)}`);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Internal Server Error'}),
        };
    }
};