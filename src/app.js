import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import busboy from 'busboy-body-parser';
import path from 'path';
import Room from './Models/Room';
import Users from './Models/User';
let app = express();
let logger = require('morgan');
let vLogger = require('log4js').getLogger();
let errorHandler = require('errorhandler');
let cookieParser = require('cookie-parser');
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);
let secrets = require('./config/secrets');
let helpers = require('./config/helpers');

app.use(logger('dev'));
app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(busboy());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');
app.set('port', secrets.port);
app.use(express.static(path.join(__dirname)));
mongoose.connect(secrets.db);
mongoose.connection
    .on('error', function() {
        vLogger.warn('MongoDB Connection Error. Make sure MongoDB is running.');
    })
    .on('connected', function(){
        vLogger.info('MongoDB connected successfully.');
        require('./config/routes')(app, helpers)
    });
require('./config/routes.js')(app);
server.listen(app.get('port'));
console.log('Server running');
io.sockets
    .on('connection', (socket) => {
        socket.on("sendUser", (user)=>{
            socket.join(user);
            socket.user_id = user;
            socket.reqUser = user;
        });
        socket.on('switchRoom', (usersIDs) => {
            let users = usersIDs.split(',');
            Room
                .findOne({users: {$all: users}})
                .exec((err, room) => {
                    if (err) return console.log(err);
                    if (!room) {
                        helpers.createPrivateRoom(users, (err, room) => {
                            if (err) return console.log(err);
                            socket.leave(socket.room);
                            socket.room = room._id;
                            socket.join(socket.room);
                        });
                    } else {
                        socket.leave(socket.room);
                        socket.room = room._id;
                        socket.join(socket.room);
                        helpers.showRoomMessages(socket.room, function(err, messages){
                            if (err) return console.log("error", err);
                            if (!messages) socket.emit('showChat');
                            Users
                                .findById(socket.reqUser)
                                .populate('avatar')
                                .exec((err, user) => {
                                    if (err) return console.log("error", err.message);
                                    if (!user) return console.log("No user");
                                    let userName = user.name+ ' ' + user.surname;
                                    socket.emit('clearChat');
                                    if (messages) socket.emit('outputMessages',userName, user, messages);
                                    socket.emit('showChat');
                                })
                        });
                    }
                })
        });
        socket.on('sendMessage', (message) => {
            helpers.sendMessage(message, socket.reqUser, socket.room, (err, data) => {
                if (err) return console.log(err.message);
                Users
                    .findById(socket.reqUser)
                    .populate('avatar')
                    .exec((err, user) => {
                        if (err) return console.log(err.message);
                        let userName = user.name+ ' ' + user.surname;
                        io.to(socket.room).emit('updatechat', userName, user, message);
                        let Getters = data.splice(data.indexOf(user._id.toString()), 1);
                        let roomSockets =  socket.adapter.rooms[socket.room];
                        if (roomSockets.length == 1) {
                            console.log("Calling");
                            console.log("data[0]", data[0]);
                            io.to(data[0]).emit('notification', 'User ' + user.email + ' send message for you');
                        } else {
                            let socketsInRoom = Object.keys(socket.adapter.rooms[socket.room].sockets);
                            let usersInRoom = [];
                            socketsInRoom.forEach(function(item){
                                if (item != socket.id){
                                    let obj = {
                                        user_id: io.sockets.connected[item].user_id,
                                        user_email: io.sockets.connected[item].user_email
                                    };
                                    if (data.indexOf(obj.user_id) != -1){
                                        data.splice(data.indexOf(obj.user_id), 1);
                                        data.forEach(function(item){
                                            Users
                                                .findById(item)
                                                .exec(function(err, user){
                                                    io.to(user._id).emit('notification', 'User ' + user.email + ' send message for you');
                                                })
                                        });
                                    }
                                }
                            });
                        }

                    })
            });
        });
    });