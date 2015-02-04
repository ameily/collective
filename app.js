var _ = require('underscore');
var express = require('express');
var multer  = require('multer');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('collective:server');
var socket_io = require('socket.io');
var http = require('http');
var config = require('./config');
var mongoose = require('mongoose');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);


mongoose.connect(config.db.uri);

var routes = require('./routes/index');
var room = require('./routes/room')({
    io: io,
    db: mongoose.connection.db
});




var port = process.env.PORT || '3000';
app.set('port', port);

app.locals.moment = require('moment');
app.locals.config = config;




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({
    dest: '/tmp'
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use('/rooms', room);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});




/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

module.exports = app;
