const AWS = require('aws-sdk');
const awsServerlessExpress = require('aws-serverless-express');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

const userPoolName = process.env.booking_userpool;
const tablesTbl = process.env.tables_table;
const reservationsTbl = process.env.reservations_table;


const validator = require('validator');

const isPasswordValid = (password) => {
    const regex = new RegExp(/^[a-z0-9.$%^*]+$/i);
    return password.length >= 12 && password.match(regex) !== null;
}

let getUserPoolId = async (userPoolName) => {
    let isTruncated = null;
    let nextToken = null;
    let poolId = null;

    do {
        const params = { MaxResults: 60 };
        if (nextToken) params.NextToken = nextToken;

        const pools = await cognito.listUserPools(params).promise();
        isTruncated = pools.NextToken ? true : false;
        nextToken = pools.NextToken;

        pools.UserPools.forEach(pool => {
            if (pool.Name === userPoolName) {
                poolId = pool.Id;
                isTruncated = false; // Immediately exit pagination when we have found the User Pool.
            }
        });
    } while (isTruncated);

    return poolId;
};

const getClientId = async (userPoolId, clientName) => {
    let isTruncated = null;
    let nextToken = null;
    let clientId = null;

    do {
        const params = {
            MaxResults: 60,
            UserPoolId: userPoolId
        };

        if (nextToken) {
            params.NextToken = nextToken;
        }

        const clientsResponse = await cognito.listUserPoolClients(params).promise();
        isTruncated = clientsResponse.NextToken ? true : false;
        nextToken = clientsResponse.NextToken;

        clientsResponse.UserPoolClients.forEach(client => {
            if (client.ClientName === clientName) {
                clientId = client.ClientId;
                isTruncated = false; // Immediately exit pagination when we have found the User Pool Client.
            }
        });

    } while (isTruncated);

    return clientId;
};

var userPoolId = '';
var userPoolClientId = '';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/signin', async (req, res) => {

    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
        return res.status(400).send({ error: 'Invalid Email Address.' });
    }

    if (userPoolId == ''){
        userPoolId = await getUserPoolId(userPoolName);
        console.log(`User Pool Id: ${userPoolId}`);
        if (userPoolClientId == ''){
           userPoolClientId = await getClientId(userPoolId, 'client-app');
           console.log(`Client Id: ${userPoolClientId}`);
        }
    }

    let authParams = {
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        ClientId: userPoolClientId,
        UserPoolId: userPoolId,
        AuthParameters: {
            'USERNAME': email,
            'PASSWORD': password
        }
    };

    let authResponse = {};
    try {
        authResponse = await cognito.adminInitiateAuth(authParams).promise();

        if (authResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            const challengeResponse = await cognito.adminRespondToAuthChallenge({
                ClientId: userPoolClientId,
                ChallengeName: 'NEW_PASSWORD_REQUIRED',
                UserPoolId: userPoolId,
                ChallengeResponses: {
                    'USERNAME': email,
                    'NEW_PASSWORD': password   // In this case, the initial password will continue to be used
                },
                Session: authResponse.Session   // This is required to match the original auth session
            }).promise();

            authResponse = challengeResponse;   // Overwrite the original auth response with the final auth response
        }

        res.send({ accessToken: authResponse.AuthenticationResult.IdToken });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

app.post('/signup',async (req, res) =>{

    const { firstName, lastName, email, password } = req.body;  // get details from request body

    if (!validator.isEmail(email)) {
        return res.status(400).send({ error: 'Invalid Email Address.' });
    }

    if (userPoolId == ''){
        userPoolId = await getUserPoolId(userPoolName);
        console.log(`User Pool Id: ${userPoolId}`);
        if (userPoolClientId == ''){
           userPoolClientId = await getClientId(userPoolId, 'client-app');
           console.log(`Client Id: ${userPoolClientId}`);
        }
    }

    // validate password using schema
    if (!isPasswordValid(password)) {
        console.log(`Password Invalid: ${password}`);
        return res.status(400).send({ error: 'Invalid Password.' });
    }

    let params = {
        UserPoolId: userPoolId ,
        Username: email ,
        MessageAction: 'SUPPRESS',
        TemporaryPassword: password,
        UserAttributes: [
            {
                Name: 'given_name',
                Value: firstName
            },
            {
                Name: 'family_name',
                Value: lastName
            }
        ]
      };

    cognito.adminCreateUser(params, function(err, data) {
    if(err){
         //error from cognito
        res.status(400).send({ error: err });
        } else {
          res.status(200).send('User created');
        }
      });
});

app.all('/tables', async (req, res) => {
    //const accessToken = req.headers.authorization.split(' ')[1];

    try {
        // Validate the access token
        /*const getUserParams = {
            AccessToken: accessToken
        };

        console.log(getUserParams);

        let user = await cognito.getUser(getUserParams).promise();*/

        if(req.method === 'GET') {
            // Perform the DynamoDB query to get all tables
            const params = {
                TableName: tablesTbl
            };

            let tables = await dynamodb.scan(params).promise();

            res.send(tables.Items);
        }

        if(req.method === 'POST') {
            const { id, number, places, isVip, minOrder } = req.body;

            // store the new table into DynamoDB
            const params = {
                TableName: tablesTbl,
                Item: { id, number, places, isVip, minOrder}
            };

            await dynamodb.put(params).promise();

            res.send({ id });
        }
    } catch(err) {
        res.status(400).send({ error: "Failed with error: " + err });
    }
});

// other code...

app.get('/tables/:tableId', async (req, res) => {
    //const accessToken = req.headers.authorization.split(' ')[1];

    /*let getUserParams = {
        AccessToken: accessToken
    };*/

    try {
        //let user = await cognito.getUser(getUserParams).promise();

        // Perform the DynamoDB query to get the table data
        let params = {
            TableName: tablesTbl,
            Key: {
                'id': parseInt(req.params.tableId, 10)
            }
        };

        let tableData = await dynamodb.get(params).promise();

        res.send(tableData.Item);
    } catch(err) {
        res.status(400).send({ error: "Failed with error: " + err });
    }
});

app.all('/reservations', async (req, res) => {
    //const accessToken = req.headers.authorization.split(' ')[1];

    try {
        /*let getUserParams = {
            AccessToken: accessToken
        };

        let user = await cognito.getUser(getUserParams).promise();*/

        if(req.method === 'GET') {
            // Perform the DynamoDB query to get all tables
            const params = {
                TableName: reservationsTbl
            };

            let reservations = await dynamodb.scan(params).promise();

            res.send(reservations.Items);

        }

        if(req.method === 'POST') {
            const { tableNumber, clientName, phoneNumber, date, slotTimeStart, slotTimeEnd } = req.body;

            const reservationId = uuidv4();

            // Store the new reservation into DynamoDB
            let params = {
                TableName: reservationsTbl,
                Item: {
                    id: reservationId,
                    tableNumber,
                    clientName,
                    phoneNumber,
                    date,
                    slotTimeStart,
                    slotTimeEnd
                }
            };

            await dynamodb.put(params).promise();

            res.send({ id: reservationId });
        }
    } catch(err) {
        res.status(400).send({ error: "Failed with error: " + err });
    }
});

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
}