'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _User = require('../Models/User');

var _User2 = _interopRequireDefault(_User);

var _News = require('../Models/News');

var _News2 = _interopRequireDefault(_News);

var _File = require('../Models/File');

var _File2 = _interopRequireDefault(_File);

var _NewsReposts = require('../Models/NewsReposts');

var _NewsReposts2 = _interopRequireDefault(_NewsReposts);

var _Post = require('../Models/Post');

var _Post2 = _interopRequireDefault(_Post);

var _Group = require('../Models/Group');

var _Group2 = _interopRequireDefault(_Group);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _helpers = require('../config/helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fileUpload = require('../Modules/fileUpload');
var like = require('../Modules/like');
var repost = require('../Modules/repost');
var _ = require('lodash');
var path = require('path');
var config = require('../config/secrets');

module.exports = {
    home: function home(req, res) {
        res.render('index.ejs', {
            user: req.user ? req.user : null
        });
    },
    sess: function sess(req, res) {
        return res.json({ user: req.user, token: req.token });
    },
    UserSignup: function UserSignup(req, res) {
        res.render('signup.ejs');
    },
    UserSignupPost: function UserSignupPost(req, res, next) {
        var body = req.body;
        _helpers2.default.SignupValidation(body, function (errors) {
            if (errors) return _helpers2.default.newError(errors.details[0].message, 401, function (error) {
                return next(error);
            });
            _User2.default.findOne({ email: body.email }).exec(function (err, user) {
                if (err) return _helpers2.default.newError(err.msg, 500, function (error) {
                    return next(error);
                });
                if (user) return _helpers2.default.newError('User already exist', 409, function (error) {
                    return next(error);
                });
                var newUser = new _User2.default(body);
                newUser.pass = newUser.generateHash(body.password);
                if (body.teacher == true) newUser.teacher = true;
                newUser.save(function (err, user) {
                    if (err) return _helpers2.default.newError(err.msg, 500, function (error) {
                        return next(error);
                    });
                    return res.status(200).redirect('/user/login');
                });
            });
        });
    },
    login: function login(req, res) {
        res.render('login.ejs');
    },
    Postlogin: function Postlogin(req, res, next) {
        var body = req.body;
        _User2.default.findOne({ email: body.email }).exec(function (err, user) {
            if (err) return _helpers2.default.newError(err.msg, 500, function (error) {
                return next(error);
            });
            if (!user) return _helpers2.default.newError('User not found', 404, function (error) {
                return next(error);
            });
            _bcryptNodejs2.default.compare(body.password, user.pass, function (err, result) {
                if (err) return _helpers2.default.newError(err.msg, 401, function (error) {
                    return next(error);
                });
                if (result === false) {
                    return next("Bad credentials");
                }
                _helpers2.default.createToken(user, function (err, token) {
                    if (err) return _helpers2.default.newError(err.msg, 500, function (error) {
                        return next(error);
                    });
                    req.user = user;
                    res.cookie("token", token);
                    res.status(200).redirect('/user/id' + user._id);
                });
            });
        });
    },
    logout: function logout(req, res) {
        req.user = null;
        res.cookie("token", '');
        return res.status(200).redirect('/user/login');
    },
    users: function users(req, res, next) {
        _User2.default.find().populate('avatar').exec(function (err, users) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            res.render('users.ejs', {
                users: users,
                user: req.user ? req.user : null
            });
        });
    },
    userProfile: function userProfile(req, res, next) {
        var obj = req.params.id;
        if (!obj) _helpers2.default.newError("Bad request", 400, function (error) {
            return next(error);
        });
        _User2.default.findById(obj).populate({ path: 'news', options: { sort: '-date' } }).populate({ path: 'news_reposts', options: { sort: 'date' } }).populate('friends avatar groups ').exec(function (err, user) {
            if (err) _helpers2.default.newError(err.msg, 500, function (error) {
                return next(error);
            });
            if (!user) _helpers2.default.newError("User not found", 404, function (error) {
                return next(error);
            });
            user.deepPopulate('news_reposts.user_id ' + ' news_reposts.user_id.avatar ' + ' news_reposts.news_id ' + ' news_reposts.news_id.creator ' + ' news_reposts.news_id.creator.avatar ' + ' news.creator news.photo friends.avatar news.creator.avatar subscribers news_reposts.news_id.photo' + ' subscribers.avatar', function (err, user) {
                if (err) _helpers2.default.newError(err.msg, 500, function (error) {
                    return next(error);
                });
                var userNews = _.concat(user.news, user.news_reposts);
                var myObjects = _.sortBy(userNews, '-date');
                res.render('user_page.ejs', {
                    userNews: myObjects ? myObjects : null,
                    user: user ? user : null,
                    reqUser: req.reqUser ? req.reqUser : null
                });
            });
        });
    },
    settings: function settings(req, res) {
        console.log(req.reqUser);
        console.log(req.user);
        res.render('user_settings.ejs', {
            user: req.user,
            reqUser: req.reqUser ? req.reqUser : null
        });
    },
    settingsPost: function settingsPost(req, res, next) {
        var body = req.body;
        req.user.set(body);
        req.user.save(function (err) {
            if (err) return _helpers2.default.newError(err.msg, 500, function (error) {
                return next(error);
            });
        });
        res.status(200).redirect('/user/settings');
    },
    avatar: function avatar(req, res, next) {
        fileUpload.fileUpload(req, 'avatar', function (err) {
            if (err) return _helpers2.default.newError(err.msg, 500, function (error) {
                return next(error);
            });
            return res.status(200).redirect('back');
        });
    },
    editNewsPost: function editNewsPost(req, res, next) {
        var body = req.body;
        _helpers2.default.requestValidation(body, 'post', function (err) {
            if (err) return _helpers2.default.newError(err, 500, function (error) {
                return next(error);
            });
        });
        if (!req.params.id) return _helpers2.default.newError("Bad request", 400, function (error) {
            return next(error);
        });
        _News2.default.findById(req.params.id).exec(function (err, news) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!req.body) return _helpers2.default.newError("Bad data", 400, function (error) {
                return next(error);
            });
            news.set(req.body);
            return news.save(function (err) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                return res.status(200).send("News updated");
            });
        });
    },
    deleteNews: function deleteNews(req, res, next) {
        if (!req.params.id) return _helpers2.default.newError("Bad request", 400, function (error) {
            return next(error);
        });
        _News2.default.findById(req.params.id, function (err, news) {
            if (!news) return _helpers2.default.newError("Not found", 404, function (error) {
                return next(error);
            });
            if (!req.user || req.user.id != news.creator) return _helpers2.default.newError("You have no rules", 403, function (error) {
                return next(error);
            });
            news.remove(function (err) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                return res.status(200).send("News was daleted");
            });
        });
    },
    newsLike: function newsLike(req, res, next) {
        like.like(_News2.default, req.body.news_id, req.user._id, function (err, obj) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            return res.status(200).redirect('back');
        });
    },
    repostNews: function repostNews(req, res, next) {
        repost.repost(_News2.default, req.body.news_id, req.user._id, function (err) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            _async2.default.waterfall([function (done) {
                _NewsReposts2.default.find().exec(function (err) {
                    if (err) return done(err.message);
                    var body = req.body;
                    var newRepNews = new _NewsReposts2.default(body);
                    newRepNews.save(function (err, object) {
                        if (err) return done(err.message);
                        done(null, object);
                    });
                });
            }, function (repostNews, done) {
                req.user.news_reposts.push(repostNews._id);
                req.user.save(function (err) {
                    if (err) return done(err.message);
                    return done(null);
                });
            }], function (err) {
                if (err) return _helpers2.default.newError(err, 500, function (error) {
                    return next(error);
                });
                return res.status(200).redirect('back');
            });
        });
    },
    getGroup: function getGroup(req, res, next) {
        if (!req.params.id) return _helpers2.default.newError("Bad request", 400, function (error) {
            return next(error);
        });
        _Group2.default.findById(req.params.id).populate('creator admins subscribers avatar').populate({ path: 'news', options: { sort: '-date' } }).exec(function (err, group) {
            console.log("err", err);
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!group) return _helpers2.default.newError("Group not found", 404, function (error) {
                return next(error);
            });
            group.deepPopulate('news.creator admins.avatar admins subscribers subscribers.avatar news.creator.avatar news.photo', function (err, group) {
                res.render('group_page.ejs', {
                    group: group ? group : null,
                    reqUser: req.reqUser ? req.reqUser : null
                });
            });
        });
    },
    getMyGroups: function getMyGroups(req, res, next) {
        var user = req.user._id;
        _Group2.default.find({ subscribers: user }).populate('avatar').exec(function (err, groups) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!groups) return _helpers2.default.newError("Group not found", 404, function (error) {
                return next(error);
            });
            res.render('myGroups.ejs', {
                groups: groups ? groups : null,
                user: req.user ? req.user : null,
                reqUser: req.reqUser ? req.reqUser : null
            });
        });
    },
    getAllGroups: function getAllGroups(req, res, next) {
        _Group2.default.find().populate('avatar').exec(function (err, groups) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!groups) return _helpers2.default.newError("Groups not found", 404, function (error) {
                return next(error);
            });
            res.render('allGroups.ejs', {
                groups: groups ? groups : null,
                user: req.user ? req.user : null,
                reqUser: req.reqUser ? req.reqUser : null
            });
        });
    },
    getMyGroupsAdmin: function getMyGroupsAdmin(req, res, next) {
        var user = req.user._id;
        _Group2.default.find({ admins: user }).populate('avatar').exec(function (err, groups) {
            if (err) return _helpers2.default.newError(err.msg, 404, function (error) {
                return next(error);
            });
            res.render('adminGroups.ejs', {
                groups: groups ? groups : null,
                user: req.user ? req.user : null,
                reqUser: req.reqUser ? req.reqUser : null
            });
        });
    },
    newGroup: function newGroup(req, res) {
        res.render('new_group.ejs');
    },
    newGroupPost: function newGroupPost(req, res, next) {
        var body = req.body;
        _helpers2.default.requestValidation(body, 'group_create', function (err) {
            if (err) return _helpers2.default.newError(err, 500, function (error) {
                return next(error);
            });
        });
        var newGroup = new _Group2.default(body);
        newGroup.creator = req.user._id;
        newGroup.date = Date.now();
        newGroup.admins = req.user._id;
        newGroup.subscribers = req.user._id;
        newGroup.save(function (err, sGroup) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            req.user.groups.push(sGroup._id);
            req.user.save();
            return res.status(200).redirect('back');
        });
    },
    groupAvatar: function groupAvatar(req, res, next) {
        if (!req.body.group_id) return _helpers2.default.newError("Bad request", 400, function (error) {
            return next(error);
        });
        _Group2.default.findById(req.body.group_id).exec(function (err, group) {
            console.log("group.creator", _typeof(group.creator));
            console.log("req.user._id", _typeof(req.user._id));
            if (JSON.stringify(req.user._id) != JSON.stringify(group.creator) && group.admins.indexOf(req.user._id) == -1) return _helpers2.default.newError("You are not admin", 401, function (error) {
                return next(error);
            });
            fileUpload.fileUpload(req, 'group_avatar', function (err, msg) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                group.avatar = msg.data._id;
                group.save();
                res.redirect('/group/id' + req.body.group_id);
            });
        });
    },
    editGroup: function editGroup(req, res, next) {
        var body = req.body;
        _helpers2.default.requestValidation(body, 'group', function (err) {
            if (err) return _helpers2.default.newError(err, 500, function (error) {
                return next(error);
            });
        });
        console.log(body);
        _Group2.default.findById(body.group_id).exec(function (err, group) {
            console.log(err);
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!group) return _helpers2.default.newError("Group not found", 404, function (error) {
                return next(error);
            });
            if (!req.user && (req.user.id != group.creator || group.admins.includes(req.user._id))) return _helpers2.default.newError("You have no rules", 403, function (error) {
                return next(error);
            });
            group.set(req.body);
            return group.save(function (err) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                return res.status(200).redirect('back');
            });
        });
    },
    addGroupSubscriber: function addGroupSubscriber(req, res, next) {
        var body = req.body;
        console.log(body);
        if (!body.group_id || !body.user_id) return _helpers2.default.newError("User or group not allowed", 404, function (error) {
            return next(error);
        });
        _Group2.default.findById(body.group_id).exec(function (err, group) {
            if (!group) return _helpers2.default.newError("Group  not found", 404, function (error) {
                return next(error);
            });
            if (group.subscribers.indexOf(body.user_id) != -1) return res.status(200).redirect('back');
            _User2.default.findById(body.user_id).exec(function (err, user) {
                if (!user) return _helpers2.default.newError("User not found", 404, function (error) {
                    return next(error);
                });
                if (user.groups.indexOf(body.group_id) != -1) return res.status(200).redirect('back');
                group.subscribers.push(user._id);
                user.groups.push(group._id);
                group.save(function (err) {
                    if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                        return next(error);
                    });
                });
                user.save(function (err) {
                    if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                        return next(error);
                    });
                });
                return res.status(200).redirect('back');
            });
        });
    },
    removeGroupSubscriber: function removeGroupSubscriber(req, res, next) {
        var body = req.body;
        console.log(body);
        if (!body.group_id || !body.user_id) return _helpers2.default.newError("User or group not allowed", 404, function (error) {
            return next(error);
        });
        _async2.default.waterfall([function (done) {
            _Group2.default.findById(body.group_id).exec(function (err, group) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                if (!group) return _helpers2.default.newError("Group  not found", 404, function (error) {
                    return next(error);
                });
                var index = group.subscribers.indexOf(body.user_id);
                if (index == -1) done(null, 'Ok');
                group.subscribers.splice(index, 1);
                group.save(function (err) {
                    if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                        return next(error);
                    });
                    done(null, 'Ok');
                });
            });
        }, function (arg, done) {
            _User2.default.findById(body.user_id).exec(function (err, user) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                if (!user) return _helpers2.default.newError("User not found", 404, function (error) {
                    return next(error);
                });
                var index = user.groups.indexOf(body.group_id);
                if (index == -1) done(null, 'Ok');
                user.groups.splice(index, 1);
                user.save(function (err) {
                    if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                        return next(error);
                    });
                    done(null, 'Ok');
                });
            });
        }], function (err) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            return res.status(200).redirect('back');
        });
    },
    editGroupPost: function editGroupPost(req, res, next) {
        var body = req.body;
        _helpers2.default.requestValidation(body, 'group');
        if (!req.params.id) return res.status(400).send("Bad request");
        _Group2.default.findById(req.params.id).exec(function (err, group) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!group) return _helpers2.default.newError("Group not found", 404, function (error) {
                return next(error);
            });
            if (!req.user && (req.user.id != group.creator || group.admins.includes(req.user._id))) return _helpers2.default.newError("You have no rules", 403, function (error) {
                return next(error);
            });
            group.set(req.body);
            return group.save(function (err) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                return res.status(200).json(group);
            });
        });
    },
    deleteGroup: function deleteGroup(req, res, next) {
        if (!req.params.id) return _helpers2.default.newError("Bad request", 400, function (error) {
            return next(error);
        });
        _Group2.default.findById(req.params.id, function (err, group) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!group) return _helpers2.default.newError("Group not found", 404, function (error) {
                return next(error);
            });
            if (!req.user && (req.user.id != group.creator || !group.admins.includes(req.user._id))) return _helpers2.default.newError("Its not your question", 403, function (error) {
                return next(error);
            });
            group.remove(function (err) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                return res.send("Group was deleted");
            });
        });
    },

    newsNewPost: function newsNewPost(req, res, next) {
        var body = req.body;
        _helpers2.default.requestValidation(body, 'News', function (err) {
            if (err) return _helpers2.default.newError(err, 500, function (error) {
                return next(error);
            });
        });
        var newNews = new _News2.default(body);
        newNews.creator = req.user._id;
        newNews.date = Date.now();
        newNews.save(function (err, sNews) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            _async2.default.waterfall([function (done) {
                if (req.files.file.data.length < 0) return done(null, 'ok');
                fileUpload.fileUpload(req, 'news', function (err, msg) {
                    sNews.photo = msg.data._id;
                    sNews.save(function (err) {
                        if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                            return next(error);
                        });
                    });
                    return done(null, 'ok');
                });
            }, function (status, done) {
                req.user.news.push(sNews._id);
                req.user.save();
                return done(null, sNews);
            }], function (err) {
                if (err) return _helpers2.default.newError(err, 500, function (error) {
                    return next(error);
                });
                return res.redirect('back');
            });
        });
    },

    postNew: function postNew(req, res, next) {
        var body = req.body;
        if (!body.group_id) return _helpers2.default.newError("Bad request", 403, function (error) {
            return next(error);
        });
        _helpers2.default.requestValidation(body, 'Post', function (err) {
            if (err) return _helpers2.default.newError(err, 500, function (error) {
                return next(error);
            });
        });
        _Group2.default.findById(req.body.group_id).exec(function (err, group) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!req.user && (req.user.id != group.creator || group.admins.includes(req.user._id))) return _helpers2.default.newError("You can't add post for this group!", 401, function (error) {
                return next(error);
            });
            var newPost = new _News2.default(body);
            newPost.creator = req.user._id;
            newPost.date = Date.now();
            newPost.save(function (err, sPost) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                _async2.default.waterfall([function (done) {
                    if (!req.files.file.data) return done(null, "ok");
                    fileUpload.fileUpload(req, 'post', function (err, msg) {
                        if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                            return next(error);
                        });
                        if (msg) {
                            sPost.photo = msg.data._id;
                            sPost.save();
                            done(null, "ok");
                        }
                    });
                }, function (status, done) {
                    req.user.posts.push(sPost._id);
                    req.user.save();
                    group.news.push(sPost._id);
                    group.save();
                    done(null, sPost);
                }], function (err) {
                    if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                        return next(error);
                    });
                    return res.redirect('/group/id' + group._id);
                });
            });
        });
    },
    //editPost: (req, res) => {
    //    if (!req.params.id) return res.status(403).send("Bad request");
    //    mongoose.model('Post')
    //        .findById(req.params.id)
    //        .exec((err, post) => {
    //        if (!post) return res.status(404).send("Post not found!");
    //        Group
    //            .find({posts: post._id})
    //            .exec((err, group) => {
    //                if (err) return res.status(500).send(err);
    //                if (!group) return res.status(404).send("Group not found!");
    //                if ((req.user.id != post.creator) || (group.admins.includes(req.user._id)))
    //                    return res.status(401).send("It's not your post");
    //                    return res.render('edit_post.ejs', {
    //                        post: post ? post : null
    //                    });
    //            })
    //    });
    //},
    editPostPost: function editPostPost(req, res, next) {
        var body = req.body;
        _helpers2.default.requestValidation(body, 'post');
        _Post2.default.findById(req.params.id).exec(function (err, post) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            post.set(body);
            return post.save(function (err) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                res.status(200).send({ message: 'Post updated!' });
            });
        });
    },
    deletePost: function deletePost(req, res, next) {
        if (!req.params.id) return _helpers2.default.newError("Bad request", 401, function (error) {
            return next(error);
        });
        return _Post2.default.findById(req.params.id, function (err, post) {
            if (!post) return res.status(404).send("Post not found");
            _Group2.default.find({ posts: post._id }).exec(function (err, group) {
                if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                    return next(error);
                });
                if (!group) return _helpers2.default.newError("Post not found", 404, function (error) {
                    return next(error);
                });
                if (req.user.id != post.creator || !group.admins.includes(req.user._id)) return _helpers2.default.newError("You have no rules", 403, function (error) {
                    return next(error);
                });
                post.remove(function (err) {
                    if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                        return next(error);
                    });
                    return res.status(200).send("Post removed");
                });
            });
        });
    },
    likePost: function likePost(req, res, next) {
        if (!req.body.news_id) return _helpers2.default.newError("Bad request", 401, function (error) {
            return next(error);
        });
        like.like(_News2.default, req.body.news_id, req.user._id, function (err) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            return res.status(200).redirect("back");
        });
    },
    addFriend: function addFriend(req, res, next) {
        if (!req.body.friend_id) return _helpers2.default.newError("Bad request", 401, function (error) {
            return next(error);
        });
        var body = req.body;
        _mongoose2.default.model('User').findById(body.friend_id).exec(function (err, user) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!user) return _helpers2.default.newError("User not found", 404, function (error) {
                return next(error);
            });
            if (user.friendsRequests.indexOf(req.user._id) != -1) return _helpers2.default.newError("You are already send invite for this user", 400, function (error) {
                return next(error);
            });
            user.friendsRequests.push(req.user._id);
            if (user.subscribers.indexOf(req.user._id) == -1) {
                user.subscribers.push(req.user._id);
            }
            user.save();
            return res.status(200).redirect('back');
        });
    },
    removeFriendRequest: function removeFriendRequest(req, res, next) {
        if (!req.body.friend_id) return _helpers2.default.newError("Bad request", 401, function (error) {
            return next(error);
        });
        var body = req.body;
        _mongoose2.default.model('User').findById(body.friend_id).exec(function (err, user) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!user) return _helpers2.default.newError("User not found", 404, function (error) {
                return next(error);
            });
            var userIndex = user.friendsRequests.indexOf(req.user._id);
            user.friendsRequests.splice(userIndex, 1);
            user.subscribers.splice(userIndex, 1);
            user.save();
            return res.status(200).redirect('back');
        });
    },
    removeFriend: function removeFriend(req, res, next) {
        if (!req.body.friend_id) return _helpers2.default.newError("Bad request", 401, function (error) {
            return next(error);
        });
        var body = req.body;
        _mongoose2.default.model('User').findById(body.friend_id).exec(function (err, user) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!user) return _helpers2.default.newError("User not found", 404, function (error) {
                return next(error);
            });
            var friendIndex = user.friends.indexOf(req.user._id);
            var userIndex = req.user.friends.indexOf(user._id);
            user.friends.splice(friendIndex, 1);
            req.user.friends.splice(userIndex, 1);
            user.save();
            req.user.save();
            return res.status(200).redirect('back');
        });
    },
    confirmFriend: function confirmFriend(req, res, next) {
        if (!req.body.friend_id) return _helpers2.default.newError("Bad request", 401, function (error) {
            return next(error);
        });
        var reqUser = req.user;
        var body = req.body;
        _User2.default.findById(body.friend_id).exec(function (err, user) {
            if (err) return _helpers2.default.newError(err.message, 500, function (error) {
                return next(error);
            });
            if (!user.friends.includes(reqUser._id)) {
                user.friends.push(reqUser._id);
                user.save();
            }
            if (!reqUser.friends.includes(body.friend_id)) reqUser.friends.push(body.friend_id);
            var index = reqUser.subscribers.indexOf(body.friend_id);
            reqUser.subscribers.splice(index, 1);
            var index = reqUser.friendsRequests.indexOf(body.friend_id);
            reqUser.friendsRequests.splice(index, 1);
            reqUser.save();
            return res.redirect('/user/friends');
        });
    },
    userFriends: function userFriends(req, res, next) {
        _User2.default.find({ '_id': { $in: req.user.friends } }).exec(function (err, users) {
            if (err) _helpers2.default.newError(err.msg, 500, function (error) {
                return next(error);
            });
            if (users.length == 0) return res.status(200).redirect('/users');
            return res.render('friends_list.ejs', {
                friends: users ? users : null,
                user: req.user ? req.user : null
            });
        });
    },
    userMessagess: function userMessagess(req, res, next) {
        _User2.default.findById(req.user._id).populate('friends avatar').exec(function (err, user) {
            if (err) _helpers2.default.newError(err.msg, 500, function (error) {
                return next(error);
            });
            if (!user) _helpers2.default.newError("User not found", 404, function (error) {
                return next(error);
            });
            user.deepPopulate('friends.avatar', function (err, user) {
                if (err) _helpers2.default.newError(err.msg, 500, function (error) {
                    return next(error);
                });
                res.render('dialogs.ejs', {
                    user: user ? user : null,
                    reqUser: req.reqUser ? req.reqUser : null
                });
            });
        });
    }
};