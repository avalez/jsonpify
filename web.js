var express = require('express'),
  querystring = require('querystring'),
  request = require('request');

var app = express();

if ('production' == app.get('env')) {
  app.use (function (req, res, next) {
    var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
    if (schema === 'https') {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

var allowOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
if ('production' == app.get('env') && !allowOrigin) {
  throw new Error("No ACCESS_CONTROL_ALLOW_ORIGIN env variable set in production");
}

var cors = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', allowOrigin || req.headers['origin']);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(cors);

app.get('/', function (req, res) {

  var resource = req.param("resource");
  delete req.params.resource;
  var callback = req.param("callback");
  delete req.params.callback;
  if (resource && callback) {
    var url = resource + '?' + querystring.stringify(req.params);
    console.log('Retrieving ' + url);
    request(url, function (error, response, body) {
      if (error) {
        console.log(error);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(response.statusCode, callback + '(' + body + ')');
      }
    });
  }
});

if ('development' == app.get('env')) {
    app.use(express.errorHandler());    
}

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
