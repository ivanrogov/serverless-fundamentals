exports.handler = async (event) => {
    // TODO implement
    var path = event.rawPath;
    var method = event.requestContext.http.method;
    var responseJson = {};
    var response = {};
    if (path === '/hello' && method === 'GET'){
      responseJson = {
          statusCode: 200,
          message: JSON.parse(JSON.stringify('Hello from Lambda')),
      };
      response = {
          statusCode: 200,
          body: JSON.parse(JSON.stringify(responseJson)),
      };
    } else {
      var s = `Bad request syntax or unsupported method. Request path: ${path}. HTTP method: ${method}`;
      responseJson = {
          statusCode: 400,
          message: JSON.parse(JSON.stringify(s)),
      };
      response = {
          statusCode: 400,
          body: JSON.parse(JSON.stringify(responseJson)),
      };
    }
    console.log(response);
    return response;
};
