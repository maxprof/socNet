'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _busboyBodyParser = require('busboy-body-parser');

var _busboyBodyParser2 = _interopRequireDefault(_busboyBodyParser);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Room = require('./Models/Room');

var _Room2 = _interopRequireDefault(_Room);

var _User = require('./Models/User');

var _User2 = _interopRequireDefault(_User);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var logger = require('morgan');
var vLogger = require('log4js').getLogger();
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var secrets = require('./config/secrets');
var helpers = require('./config/helpers');

app.use(logger('dev'));
app.use(errorHandler());
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));
app.use((0, _busboyBodyParser2.default)());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');
app.set('port', secrets.port);
app.use(_express2.default.static(_path2.default.join(__dirname)));
_mongoose2.default.connect(secrets.db);
_mongoose2.default.connection.on('error', function () {
    vLogger.warn('MongoDB Connection Error. Make sure MongoDB is running.');
}).on('connected', function () {
    vLogger.info('MongoDB connected successfully.');
    require('./config/routes')(app, helpers);
});
require('./config/routes.js')(app);
server.listen(app.get('port'));
console.log('Server running');
io.sockets.on('connection', function (socket) {
    socket.on("sendUser", function (user) {
        socket.reqUser = user;
    });
    socket.on('switchRoom', function (usersIDs) {
        var users = usersIDs.split(',');
        _Room2.default.findOne({ users: { $all: users } }).exec(function (err, room) {
            if (err) return console.log(err);
            if (!room) {
                helpers.createPrivateRoom(users, function (err, room) {
                    if (err) return console.log(err);
                    socket.leave(socket.room);
                    socket.room = room._id;
                    socket.join(socket.room);
                });
            } else {
                socket.leave(socket.room);
                socket.room = room._id;
                socket.join(socket.room);
                helpers.showRoomMessages(socket.room, function (err, messages) {
                    if (err) return console.log("error", err);
                    if (!messages) socket.emit('showChat');
                    _User2.default.findById(socket.reqUser).populate('avatar').exec(function (err, user) {
                        if (err) return console.log("error", err.message);
                        if (!user) return console.log("No user");
                        var userName = user.name + ' ' + user.surname;
                        socket.emit('clearChat');
                        if (messages) socket.emit('outputMessages', userName, user, messages);
                        socket.emit('showChat');
                    });
                });
            }
        });
    });
    socket.on('sendMessage', function (message) {
        helpers.sendMessage(message, socket.reqUser, socket.room, function (err, data) {
            if (err) return console.log(err.message);
            _User2.default.findById(socket.reqUser).populate('avatar').exec(function (err, user) {
                if (err) return console.log(err.message);
                var userNmae = user.name + ' ' + user.surname;
                io.to(socket.room).emit('updatechat', userNmae, user, message);
            });
        });
    });
});