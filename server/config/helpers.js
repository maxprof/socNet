'use strict';

var _User = require('../Models/User');

var _User2 = _interopRequireDefault(_User);

var _Room = require('../Models/Room');

var _Room2 = _interopRequireDefault(_Room);

var _Messages = require('../Models/Messages');

var _Messages2 = _interopRequireDefault(_Messages);

var _secrets = require('./secrets');

var _secrets2 = _interopRequireDefault(_secrets);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
    createToken: function createToken(user, done) {
        var token = _jsonwebtoken2.default.sign({
            exp: (0, _moment2.default)().add(14, 'days').unix(),
            iat: (0, _moment2.default)().unix(),
            data: user._id
        }, _secrets2.default.sessionSecret);
        if (done) return done(null, token);
    },
    tokenInspection: function tokenInspection(req, res, next) {
        req.user = null;
        var token = req.cookies.token;
        if (token) {
            _jsonwebtoken2.default.verify(token, _secrets2.default.sessionSecret, function (err, decoded) {
                if (err) return res.status(501).send("Bad token");
                _User2.default.findById(decoded.data).exec(function (err, user) {
                    if (err) return res.status(501).send('/user/login');
                    if (user) {
                        req.user = user;
                        return next();
                    }
                    return res.status(404).send('/user/login');
                });
            });
        } else {
            return res.status(404).redirect('/user/login');
        }
    },
    profileInspection: function profileInspection(req, res, next) {
        var token = req.cookies.token;
        var paramsId = req.params.id;
        if (token) {
            _jsonwebtoken2.default.verify(token, _secrets2.default.sessionSecret, function (err, decoded) {
                if (err) return res.status(501).send("Bad token");
                _User2.default.findById(decoded.data).exec(function (err, user) {
                    if (err) return res.status(501).send('/user/login');
                    if (user) {
                        if (user._id == paramsId) req.reqUser = user;
                        req.user = user;
                        return next();
                    }
                    return next();
                });
            });
        } else next();
    },
    newError: function newError(msg, status, done) {
        var error = {
            message: msg,
            status: status
        };
        done(error);
    },
    SignupValidation: function SignupValidation(user, done) {
        var schema = _joi2.default.object().keys({
            name: _joi2.default.string().alphanum().min(3).max(30).required(),
            surname: _joi2.default.string().alphanum().min(3).max(30).required(),
            email: _joi2.default.string().email().required(),
            password: _joi2.default.string().regex(/^[a-zA-Z0-9]{3,30}$/)
        });
        _joi2.default.validate(user, schema, function (err) {
            if (err) return done(err);
            done(null);
        });
    },
    LoginValidation: function LoginValidation(user, done) {
        var schema = _joi2.default.object().keys({
            email: _joi2.default.string().email().required(),
            password: _joi2.default.string().regex(/^[a-zA-Z0-9]{3,30}$/)
        });
        _joi2.default.validate(user, schema, function (err) {
            if (err) return done(err);
            done(null);
        });
    },
    requestValidation: function requestValidation(obj, type, next) {
        if (type == 'user') {
            var schema = _joi2.default.object().keys({
                name: _joi2.default.string().min(3).max(30).required(),
                surname: _joi2.default.string().min(3).max(30).required(),
                email: _joi2.default.string().email().required(),
                password: _joi2.default.string().regex(/^[a-zA-Z0-9]{3,30}$/)
            });
        } else if (type == 'group_create' || type == 'news') {
            var schema = _joi2.default.object().keys({
                title: _joi2.default.string().min(3).max(30).required(),
                description: _joi2.default.string().min(3).max(2000).required()
            });
        } else if (type == 'group' || type == 'post') {
            var schema = _joi2.default.object().keys({
                title: _joi2.default.string().min(3).max(30).required(),
                description: _joi2.default.string().min(3).max(2000).required(),
                group_id: _joi2.default.string().required()
            });
        }
        _joi2.default.validate(obj, schema, function (err) {
            console.log(err);
            if (err) {
                return next(err.details[0].message);
            }
            next(null);
        });
    },
    createPrivateRoom: function createPrivateRoom(users, next) {
        _Room2.default.find().exec(function (err) {
            if (err) return next(err);
            var newRoom = new _Room2.default({
                users: users,
                private: true
            });
            newRoom.save(function (err, room) {
                if (err) return next(err);
                if (next) {
                    return next(err, room);
                }
            });
        });
    },
    showRoomMessages: function showRoomMessages(room, done) {
        _Messages2.default.find({ room: room }).populate('author').exec(function (err, messages) {
            if (err) return done(err);
            var test = [];
            if (messages) {
                messages.forEach(function (message, i) {
                    message.deepPopulate('author.avatar', function (err, message) {
                        test.push(message);
                        if (messages.length - 1 == i) {
                            console.log("test.length", test.length);
                            return done(null, test);
                        }
                    });
                });
            }
            return done(null, test);
        });
    },
    sendMessage: function sendMessage(message, user, socketRoom, done) {
        console.log((0, _moment2.default)().format('MM/DD/YYYY'));
        _Room2.default.findOne({ _id: socketRoom }).exec(function (err, room) {
            if (room) {
                var newMsg = new _Messages2.default({
                    message: message,
                    author: user,
                    room: socketRoom,
                    date: (0, _moment2.default)().format('MM/DD/YYYY,h::mm:ss')
                });
                newMsg.save(function (err, msg) {
                    if (err) return console.log(err.message);
                    _async2.default.waterfall([function (done) {
                        console.log("calling save message in room");
                        room.update({ $addToSet: { messages: msg._id } }, function (err) {
                            if (err) return done(err);
                            room.save();
                            done(null, msg);
                        });
                    }, function (msg, done) {
                        console.log("calling save message in user");
                        _User2.default.findById(user).exec(function (err, user) {
                            if (err) done(err);
                            user.messages.push(msg._id);
                            user.save();
                            console.log("Save calling?");

                            done(null, "user updated");
                        });
                    }], function (err, result) {
                        console.log("calling end");
                        if (err) done(err);
                        if (done) done(null, room.users);else done(null, "error");
                    });
                });
            } else {
                console.log("Room mot found");
            }
        });
    }
};