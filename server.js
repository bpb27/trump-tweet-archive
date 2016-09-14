var express = require('express');
var app = express();
var http = require('http').Server(app);

var port = process.env.PORT || 8000

app.use(express.static('public'));

app.get('/node_modules/angular/angular.min.js', function (req, res) {
    res.sendFile(__dirname + '/node_modules/angular/angular.min.js');
});

app.get('/node_modules/angular-route/angular-route.min.js', function (req, res) {
    res.sendFile(__dirname + '/node_modules/angular-route/angular-route.min.js');
});

app.get('/data/:year', function (req, res) {
    res.sendFile(__dirname + '/data/' + req.params.year);
});

http.listen(port, function () {
    console.log("listening on *" + port);
});
