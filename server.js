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

app.get('/bins/1v0jv', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2016.js')));
});

app.get('/bins/25qcr', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2015.js')));
});

app.get('/bins/3gvvv', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2014.js')));
});

app.get('/bins/17ni3', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2013.js')));
});

app.get('/bins/1xdff', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2012.js')));
});

app.get('/bins/4yom3', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2011.js')));
});

app.get('/bins/3tykb', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2010.js')));
});

app.get('/bins/3ao4b', function (req, res) {
    res.end(JSON.stringify(require('./stubs/2009.js')));
});

http.listen(port, function () {
    console.log("listening on *" + port);
});
