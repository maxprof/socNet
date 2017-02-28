import User from '../Models/User';
import Room from '../Models/Room';
import Messages from '../Models/Messages';
import secrets from './secrets';
import jwt from 'jsonwebtoken';
import moment from 'moment'
import Joi from 'joi';
import async from 'async';
module.exports = {
    createToken: (user, done) => {
        let token = jwt.sign({
            exp: moment().add(14, 'days').unix(),
            iat: moment().unix(),
            data: user._id
        }, secrets.sessionSecret);
        if (done) return done(null, token);
    },
    tokenInspection:  (req, res, next) => {
        req.user = null;
        let token = req.cookies.token;
        if (token) {
            jwt.verify(token, secrets.sessionSecret, (err, decoded) => {
                if (err) return res.status(501).send("Bad token");
                User
                    .findById(decoded.data)
                    .exec((err, user)=> {
                        if (err) return res.status(501).send('/user/login');
                        if (user) {
                            req.user = user;
                            req.reqUser = user;
                            return next()
                        }
                        return res.status(404).send('/user/login');
                    })
            });
        } else {
            return res.status(404).redirect('/user/login');
        }
    },
    profileInspection: (req,res,next) => {
        let token = req.cookies.token;
        let paramsId = req.params.id;
        if (!token) return next();
        jwt.verify(token, secrets.sessionSecret, (err, decoded) => {
            if (err) return res.status(501).send("Bad token");
            User
                .findById(decoded.data)
                .exec((err, user)=> {
                    if (err) return res.status(501).send('/user/login');
                    if (!user) return next();
                    if (JSON.stringify(user._id) == paramsId) {
                        req.reqUser = user;
                        req.user = user;
                         return next();
                    } else {
                        User
                            .findById(paramsId)
                            .exec((err, reqUser) => {
                                if (err) console.log(err.message);
                                req.reqUser = user;
                                req.user = reqUser;
                                return next();
                            });
                    }
                })
        });

    },
    newError: (msg, status, done) => {
        let error = {
            message: msg,
            status: status
        };
        done(error);
    },
    SignupValidation: (user, done) => {
        var schema = Joi.object().keys({
            name: Joi.string().alphanum().min(3).max(30).required(),
            surname: Joi.string().alphanum().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
        });
        Joi.validate(user, schema, (err) => {
            if (err) return done(err);
            done(null);
        });
    },
    LoginValidation: (user, done) => {
        var schema = Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
        });
        Joi.validate(user, schema, (err) => {
            if (err) return done(err);
            done(null);
        });
    },
    requestValidation: (obj, type, next) => {
        if (type == 'user') {
            var schema = Joi.object().keys({
                name: Joi.string().min(3).max(30).required(),
                surname: Joi.string().min(3).max(30).required(),
                email: Joi.string().email().required(),
                password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
            });
        } else if ((type == 'group_create') || (type == 'News') ) {
            var schema = Joi.object().keys({
                title: Joi.string().min(3).max(30).required(),
                description: Joi.string().min(3).max(2000).required(),
                type: Joi.string()
            });
        } else if (type == 'group' || (type == 'Post')) {
            var schema = Joi.object().keys({
                title: Joi.string().min(3).max(100).required(),
                description: Joi.string().min(3).max(2000).required(),
                group_id: Joi.string().required(),
                type: Joi.string()
            });
        }
        Joi.validate(obj, schema, (err) => {
            console.log(err);
            if (err) {
                return next(err.details[0].message);
            }
            next(null);
        });
    },
    createPrivateRoom: (users, next) => {
       Room
            .find()
            .exec(function(err)
            {
                if (err)  return next(err);
                let newRoom = new Room({
                    users: users,
                    private: true
                });
                newRoom.save(function(err, room){
                    if (err) return next(err);
                    if (next){
                        return next(err, room);
                    }
                });
            });
    },
    showRoomMessages: (room, done) => {
        Messages
            .find({room: room})
            .populate('author')
            .exec((err, messages) => {
                if (err) return done(err);
                let test = [];
                if (messages){
                    messages.forEach((message, i) => {
                        message.deepPopulate('author.avatar', (err, message) => {
                            test.push(message);
                            if (messages.length-1 == i) {
                                console.log("test.length",test.length);
                                return done(null, test);
                            }
                        });
                    });
                }
                return done(null, test);

            })
    },
    sendMessage: (message, user, socketRoom,  done) => {
        console.log(moment().format('MM/DD/YYYY'));
        Room
            .findOne({_id:socketRoom})
            .exec(function(err,room)
            {
                if (room){
                    let newMsg = new Messages({
                        message: message,
                        author: user,
                        room: socketRoom,
                        date: moment().format('MM/DD/YYYY,h::mm:ss')
                    });
                    newMsg.save(function(err, msg){
                        if (err) return console.log(err.message);
                        async.waterfall([
                                function(done){
                                    console.log("calling save message in room");
                                    room.update({$addToSet: {messages: msg._id}}, function(err){
                                        if (err) return done(err);
                                        room.save();
                                        done(null, msg);
                                    });
                                }, function(msg, done){
                                    console.log("calling save message in user");
                                    User
                                        .findById(user)
                                        .exec(function(err, user){
                                            if (err) done(err);
                                            user.messages.push(msg._id);
                                            user.save();
                                            console.log("Save calling?");

                                            done(null, "user updated");
                                        });
                                }
                            ],
                            function(err, result){
                                console.log("calling end");
                                if (err) done(err);
                                if (done) done(null, room.users);
                                else done(null, "error")
                            })
                    });
                } else {
                    console.log("Room mot found");
                }
            });
    }
};


