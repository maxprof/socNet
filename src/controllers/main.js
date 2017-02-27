import Users from '../Models/User';
import News from '../Models/News';
import File from '../Models/File';
import repostNews from '../Models/NewsReposts';
import Posts from '../Models/Post';
import Group from '../Models/Group';
import mongoose from 'mongoose';
import async from 'async';
import helpers from '../config/helpers';
import bcrypt from 'bcrypt-nodejs';
const fileUpload = require('../Modules/fileUpload');
const like = require('../Modules/like');
const repost = require('../Modules/repost');
import moment from 'moment'
const _ = require('lodash');
module.exports = {
    home: (req, res) => {
        res.render('index.ejs', {
            user: req.user ? req.user : null
        });
    },
    sess: (req, res) => res.json({user: req.user, token: req.token}),
    UserSignup: (req, res) =>{
        res.render('signup.ejs');
    },
    UserSignupPost: (req, res, next) => {
        let body = req.body;
        helpers.SignupValidation(body, (errors)=>{
            if (errors) return helpers.newError( errors.details[0].message, 401, (error) => { return next(error); });
            Users
                .findOne({email: body.email})
                .exec((err, user) => {
                    if (err) return helpers.newError(err.msg, 500, (error) => { return next(error); });
                    if (user) return helpers.newError('User already exist', 409, (error)=>{ return next(error); });
                    let newUser = new Users(body);
                    newUser.pass = newUser.generateHash(body.password);
                    if (body.teacher == true) newUser.teacher = true;
                    newUser.save((err, user) => {
                        if (err) return helpers.newError(err.msg, 500, (error)=>{ return next(error); });
                        return res.status(200).redirect('/user/login');
                    })
                })
        });
    },
    login: (req, res) => {
        res.render('login.ejs');
    },
    Postlogin: (req, res, next) => {
        let body = req.body;
        Users
            .findOne({email: body.email})
            .exec((err, user)=>{
                if (err) return helpers.newError(err.msg, 500, (error) => { return next(error) });
                if (!user) return helpers.newError('User not found', 404, (error) => { return next(error)});
                bcrypt.compare(body.password, user.pass, (err, result) => {
                    if (err) return helpers.newError(err.msg, 401, (error) => { return next(error) });
                    if (result === false) {
                        return next("Bad credentials");
                    }
                    helpers.createToken(user, (err, token) => {
                        if (err) return helpers.newError(err.msg, 500, (error) => { return next(error) });
                        req.user = user;
                        res.cookie("token", token);
                        res.status(200).redirect('/user/id'+user._id);
                    });
                });
            });
    },
    logout: (req, res) => {
        req.user = null;
        res.cookie("token", '');
        res.status(200).send("OK");
    },
    users: (req, res, next) => {
        Users
            .find()
            .populate('avatar')
            .exec((err, users) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                res.render('users.ejs', {
                    users:users,
                    user: req.user ? req.user : null
                });
            })
    },
    userProfile: (req, res, next) => {
        let obj = req.params.id;
        if (!obj) helpers.newError("Bad request", 400, (error) => { return next(error) });
        Users
            .findById(obj)
            .populate({path: 'news', options: { sort: '-date' } })
            .populate({path: 'news_reposts', options: { sort: 'date' }})
            .populate('friends avatar groups ')
            .exec((err, user) => {
                if (err)  helpers.newError(err.msg, 500, (error) => { return next(error) });
                if (!user) helpers.newError("User not found", 404, (error) => { return next(error) });
                user.deepPopulate('news_reposts.user_id ' +
                    ' news_reposts.user_id.avatar ' +
                    ' news_reposts.news_id ' +
                    ' news_reposts.news_id.creator ' +
                    ' news_reposts.news_id.creator.avatar ' +
                    ' news.creator news.photo friends.avatar news.creator.avatar subscribers news_reposts.news_id.photo' +
                    ' subscribers.avatar', (err, user) => {
                    if (err) helpers.newError(err.msg, 500, (error) => { return next(error) });
                    let userNews = _.concat(user.news,user.news_reposts);
                    let myObjects = _.sortBy(userNews, '-date');
                    res.render('user_page.ejs', {
                        userNews: myObjects ? myObjects: null,
                        user: user ? user : null,
                        reqUser: req.reqUser ? req.reqUser : null
                    });
                });
            })
    },
    settings: (req, res) => {
        res.render('user_settings.ejs', {
            user: req.user
        });
    },
    settingsPost: (req, res) => {
        let body = req.body;
        console.log(body);
        req.user.set(body);
        req.user.save((err)=>{ if (err) return helpers.newError(err.msg, 500, (error) => { return next(error) }); });
        res.status(200).redirect('/user/settings');
    },
    avatar: (req, res) => {
        fileUpload.fileUpload(req, 'avatar', (err, msg) => {
            return res.status(200).redirect('back');
        });
    },
    editNewsPost: (req, res, next) => {
        const body = req.body;
        helpers.requestValidation(body, 'post', (err)=>{
            if (err) return helpers.newError(err, 500, (error) => { return next(error) });
        });
        if (!req.params.id) return helpers.newError("Bad request", 400, (error) => { return next(error); });
        News
            .findById(req.params.id)
            .exec( (err, news) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!req.body) return helpers.newError("Bad data", 400, (error) => { return next(error); });
                news.set(req.body);
                return news.save(err => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    return res.status(200).send("News updated");
                });
            });
    },
    deleteNews: (req, res, next) => {
        if (!req.params.id) return helpers.newError("Bad request", 400, (error) => { return next(error); });
        News
            .findById(req.params.id, (err, news) => {
                if(!news) return helpers.newError("Not found", 404, (error) => { return next(error); });
                if (!req.user || (req.user.id != news.creator))  return helpers.newError("You have no rules", 403, (error) => { return next(error); });
                news.remove(err => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    return res.status(200).send("News was daleted");
                })
            });
    },
    newsLike: (req, res, next) =>{
        like.like(News, req.body.news_id, req.user._id, (err, obj) => {
            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
            return res.status(200).redirect('back')
        })
    },
    repostNews: (req, res, next) =>{
        repost.repost(News, req.body.news_id, req.user._id, (err) => {
            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
            async.waterfall([
                    (done) => {
                        repostNews
                            .find()
                            .exec((err) => {
                                if (err) return done(err.message);
                                let body = req.body;
                                let newRepNews =  new repostNews(body);
                                newRepNews.save((err, object) => {
                                    if (err) return done(err.message);
                                    done(null, object);
                                })
                            })
                    },
                    (repostNews, done) => {
                        req.user.news_reposts.push(repostNews._id);
                        req.user.save((err) => {
                            if (err) return done(err.message);
                            return done(null)
                        });
                    }
                ],
                (err)=> {
                    if (err) return helpers.newError(err, 500, (error) => { return next(error); });
                    return res.status(200).redirect('back')
                });
        })
    },
    getGroup: (req, res, next) => {
        if (!req.params.id) return helpers.newError("Bad request", 400, (error) => { return next(error); });
        Group
            .findById(req.params.id)
            .populate('creator admins subscribers avatar')
            .populate({path: 'news', options: { sort: '-date' } })
            .exec((err, group) => {
            console.log("err", err);
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!group) return helpers.newError("Group not found", 404, (error) => { return next(error); });
                group.deepPopulate('news.creator admins.avatar admins subscribers subscribers.avatar news.creator.avatar news.photo', (err, group) => {
                    res.render('group_page.ejs', {
                        group: group ? group : null,
                        user: req.reqUser ? req.reqUser : null
                    });
                });
            })
    },
    getMyGroups: (req, res, next) => {
        const user = req.user._id;
        Group
            .find({subscribers:  user})
            .populate('avatar')
            .exec((err, groups) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!groups) return helpers.newError("Group not found", 404, (error) => { return next(error); });
                res.render('myGroups.ejs', {
                    groups: groups ? groups : null,
                    user: req.user ? req.user : null
                });
            })
    },
    getAllGroups: (req, res, next) => {
        Group
            .find()
            .populate('avatar')
            .exec((err, groups) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!groups) return helpers.newError("Groups not found", 404, (error) => { return next(error); });
                res.render('allGroups.ejs', {
                    groups: groups ? groups : null,
                    user: req.user ? req.user : null
                });
            })
    },
    getMyGroupsAdmin: (req, res, next) => {
        const user = req.user._id;
        Group
            .find({admins:  user})
            .populate('avatar')
            .exec((err, groups) => {
                if (err) return helpers.newError(err.msg, 404, (error) => { return next(error) });
                res.render('adminGroups.ejs', {
                    groups: groups ? groups : null,
                    user: req.user ? req.user : null
                });
            })
    },
    newGroup: (req, res) => {
        res.render('new_group.ejs');
    },
    newGroupPost: (req, res, next) => {
        const body = req.body;
        helpers.requestValidation(body, 'group_create', (err)=>{
            if (err) return helpers.newError(err, 500, (error) => { return next(error) });
        });
        const newGroup = new Group(body);
        newGroup.creator = req.user._id;
        newGroup.date = Date.now();
        newGroup.admins = req.user._id;
        newGroup.subscribers = req.user._id;
        newGroup.save((err, sGroup) => {
            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
            req.user.groups.push(sGroup._id);
            req.user.save();
            return res.status(200).redirect('back');
        });
    },
    groupAvatar: (req, res, next) => {
        if (!req.body.group_id) return helpers.newError("Bad request", 400, (error) => { return next(error); });
        Group
            .findById(req.body.group_id)
            .exec((err, group) => {
            console.log("group.creator", typeof  group.creator);
            console.log("req.user._id", typeof req.user._id);
                if (( JSON.stringify(req.user._id) != JSON.stringify(group.creator)) && ( group.admins.indexOf(req.user._id) == -1 ))
                    return helpers.newError("You are not admin", 401, (error) => { return next(error) });
                fileUpload.fileUpload(req, 'group_avatar', (err, msg) => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    group.avatar = msg.data._id;
                    group.save();
                    res.redirect(`/group/id${req.body.group_id}`);
                });
            });
    },
    editGroup: (req, res, next) => {
        let body = req.body;
        helpers.requestValidation(body, 'group', (err)=>{
            if (err) return helpers.newError(err, 500, (error) => { return next(error) });
        });
        console.log(body);
        Group
            .findById(body.group_id)
            .exec( (err, group) => {
                console.log(err);
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!group) return helpers.newError("Group not found", 404, (error) => { return next(error); });
                if (!req.user && ((req.user.id != group.creator) || (group.admins.includes(req.user._id))))
                    return helpers.newError("You have no rules", 403, (error) => { return next(error); });
                group.set(req.body);
                return group.save(err => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    return res.status(200).redirect('back');
                });
            });
    },
    addGroupSubscriber: (req, res, next) => {
        let body = req.body;
        console.log(body);
        if (!body.group_id || !body.user_id) return helpers.newError("User or group not allowed", 404, (error) => { return next(error) });
        Group
            .findById(body.group_id)
            .exec((err, group)=> {
            if (!group) return helpers.newError("Group  not found", 404, (error) => { return next(error) });
            if (group.subscribers.indexOf(body.user_id) != -1) return res.status(200).redirect('back');
                Users
                    .findById(body.user_id)
                    .exec((err, user)=>{
                        if (!user) return helpers.newError("User not found", 404, (error) => { return next(error) });
                        if (user.groups.indexOf(body.group_id) != -1) return res.status(200).redirect('back');
                        group.subscribers.push(user._id);
                        user.groups.push(group._id);
                        group.save((err)=>{
                            if (err) return helpers.newError(err.message, 500, (error) => { return next(error) });
                        });
                        user.save((err)=>{
                            if (err) return helpers.newError(err.message, 500, (error) => { return next(error) });
                        });
                        return res.status(200).redirect('back')
                    })
            })
    },
    removeGroupSubscriber: (req, res, next) => {
        let body = req.body;
        console.log(body);
        if (!body.group_id || !body.user_id) return helpers.newError("User or group not allowed", 404, (error) => { return next(error) });
        async.waterfall([
                (done) => {
                    Group
                        .findById(body.group_id)
                        .exec((err, group)=> {
                            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                            if (!group) return helpers.newError("Group  not found", 404, (error) => { return next(error) });
                            let index = group.subscribers.indexOf(body.user_id);
                            if (index == -1) done(null, 'Ok');
                            group.subscribers.splice(index,1);
                            group.save((err)=>{
                                if (err) return helpers.newError(err.message, 500, (error) => { return next(error) });
                                done(null, 'Ok');
                            });
                        })
                },
                (arg, done) => {
                    Users
                        .findById(body.user_id)
                        .exec((err, user)=>{
                            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                            if (!user) return helpers.newError("User not found", 404, (error) => { return next(error) });
                            let index = user.groups.indexOf(body.group_id);
                            if (index == -1) done(null, 'Ok');
                            user.groups.splice(index,1);
                            user.save((err)=>{
                                if (err) return helpers.newError(err.message, 500, (error) => { return next(error) });
                                done(null, 'Ok');
                            });
                        })
                }
            ],
        (err)=> {
            if (err) return helpers.newError(err.message, 500, (error) => { return next(error) });
            return res.status(200).redirect('back');
        })
    },
    editGroupPost: (req, res, next) => {
        let body = req.body;
        helpers.requestValidation(body, 'group');
        if (!req.params.id) return res.status(400).send("Bad request");
        Group
            .findById(req.params.id)
            .exec( (err, group) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!group) return helpers.newError("Group not found", 404, (error) => { return next(error); });
                if (!req.user && ((req.user.id != group.creator) || (group.admins.includes(req.user._id))))
                    return helpers.newError("You have no rules", 403, (error) => { return next(error); });
                group.set(req.body);
                return group.save(err => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    return res.status(200).json(group)
                });
            });
    },
    deleteGroup: (req, res, next) => {
        if (!req.params.id) return helpers.newError("Bad request", 400, (error) => { return next(error); });
        Group
            .findById(req.params.id, (err, group) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if(!group) return helpers.newError("Group not found", 404, (error) => { return next(error); });
                if (!req.user && ((req.user.id != group.creator) || (!group.admins.includes(req.user._id)) ))
                    return helpers.newError("Its not your question", 403, (error) => { return next(error); });
                group.remove(err => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    return res.send("Group was deleted");
                })
            });
    },

    newsNewPost: (req, res, next) => {
        const body = req.body;
        helpers.requestValidation(body, 'News', (err)=>{
            if (err) return helpers.newError(err, 500, (error) => { return next(error) });
        });
        const newNews = new News(body);
        newNews.creator = req.user._id;
        newNews.date = Date.now();
        newNews.save((err, sNews) => {
            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
            async.waterfall([
                    function(done){
                        if (req.files.file.data.length<0) return done(null, 'ok');
                        fileUpload.fileUpload(req, 'news', function (err, msg) {
                            sNews.photo = msg.data._id;
                            sNews.save((err)=> {
                                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                            });
                            return done(null, 'ok');
                        });
                    }, function(status, done){
                        req.user.news.push(sNews._id);
                        req.user.save();
                        return done(null, sNews)
                    }
                ],
                function(err){
                    if (err) return helpers.newError(err, 500, (error) => { return next(error) });
                    return res.redirect('back');
                });
        });
    },

    postNew: (req, res, next) => {
        const body = req.body;
        if (!body.group_id)  return helpers.newError("Bad request", 403, (error) => { return next(error) });
        helpers.requestValidation(body, 'Post', (err)=>{
            if (err) return helpers.newError(err, 500, (error) => { return next(error) });
        });
        Group
            .findById(req.body.group_id)
            .exec((err, group) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!req.user && ((req.user.id != group.creator) || (group.admins.includes(req.user._id))))
                    return helpers.newError("You can't add post for this group!", 401, (error) => { return next(error) });
                const newPost = new News(body);
                newPost.creator = req.user._id;
                newPost.date = Date.now();
                newPost.save((err, sPost) => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    async.waterfall([
                                done => {
                                if (!req.files.file.data) return done(null,"ok");
                                fileUpload.fileUpload(req, 'post', (err, msg) => {
                                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                                    if (msg){
                                        sPost.photo = msg.data._id;
                                        sPost.save();
                                        done(null, "ok");
                                    }
                                });
                            }, (status, done) => {
                                req.user.posts.push(sPost._id);
                                req.user.save();
                                group.news.push(sPost._id);
                                group.save();
                                done(null, sPost)
                            }
                        ],
                        (err) => {
                            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                            return res.redirect(`/group/id${group._id}`);
                        });
                });

            })
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
    editPostPost: (req, res, next) => {
        const body = req.body;
        helpers.requestValidation(body, 'post');
        Posts
            .findById(req.params.id)
            .exec( (err, post) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                post.set(body);
                return post.save(err => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    res.status(200).send({ message: 'Post updated!' });
                });
            });
    },
    deletePost: (req, res, next) => {
        if (!req.params.id) return helpers.newError("Bad request", 401, (error) => { return next(error); });
        return Posts.findById(req.params.id, (err, post) => {
            if (!post) return res.status(404).send("Post not found");
            Group
                .find({posts: post._id})
                .exec((err, group) => {
                    if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                    if (!group) return helpers.newError("Post not found", 404, (error) => { return next(error); });
                    if ((req.user.id != post.creator) || (!group.admins.includes(req.user._id)))
                        return helpers.newError("You have no rules", 403, (error) => { return next(error); });
                    post.remove(err => {
                        if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                        return res.status(200).send("Post removed")
                    })
                });
        });
    },
    likePost: (req, res, next) => {
        if (!req.body.news_id) return helpers.newError("Bad request", 401, (error) => { return next(error); });
        like.like(News, req.body.news_id, req.user._id, err => {
            if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
            return res.status(200).redirect("back")
        })
    },
    addFriend: (req, res, next) => {
        if (!req.body.friend_id) return helpers.newError("Bad request", 401, (error) => { return next(error); });
        const body = req.body;
        mongoose.model('User')
            .findById(body.friend_id)
            . exec((err, user) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!user) return helpers.newError("User not found", 404, (error) => { return next(error); });
                if (user.friendsRequests.indexOf(req.user._id) != -1) return helpers.newError("You are already send invite for this user", 400, (error) => { return next(error); });
                user.friendsRequests.push(req.user._id);
                if (user.subscribers.indexOf(req.user._id) == -1){
                    user.subscribers.push(req.user._id);
                }
                user.save();
                return res.status(200).redirect('back');
            });
    },
    removeFriendRequest: (req, res, next) => {
        if (!req.body.friend_id) return helpers.newError("Bad request", 401, (error) => { return next(error); });
        const body = req.body;
        mongoose.model('User')
            .findById(body.friend_id)
            . exec((err, user) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!user) return helpers.newError("User not found", 404, (error) => { return next(error); });
                let userIndex = user.friendsRequests.indexOf(req.user._id);
                user.friendsRequests.splice(userIndex, 1);
                user.subscribers.splice(userIndex, 1);
                user.save();
                return res.status(200).redirect('back');
            });
    },
    removeFriend: (req, res, next) => {
        if (!req.body.friend_id) return helpers.newError("Bad request", 401, (error) => { return next(error); });
        const body = req.body;
        mongoose.model('User')
            .findById(body.friend_id)
            . exec((err, user) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
                if (!user) return helpers.newError("User not found", 404, (error) => { return next(error); });
                let friendIndex = user.friends.indexOf(req.user._id);
                let userIndex = req.user.friends.indexOf(user._id);
                user.friends.splice(friendIndex, 1);
                req.user.friends.splice(userIndex, 1);
                user.save();
                req.user.save();
                return res.status(200).redirect('back');
            });
    },
    confirmFriend: (req, res, next) => {
        if (!req.body.friend_id) return helpers.newError("Bad request", 401, (error) => { return next(error); });
        const reqUser = req.user;
        const body = req.body;
        Users
            .findById(body.friend_id)
            .exec((err, user) => {
                if (err) return helpers.newError(err.message, 500, (error) => { return next(error); });
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
    userFriends: (req, res, next) => {
        Users
            .find({ '_id': { $in: req.user.friends }})
            .exec((err, users) => {
                if (err)  helpers.newError(err.msg, 500, (error) => { return next(error) });
                if (users.length == 0) return res.status(200).redirect('/users');
                return res.render('friends_list.ejs', {
                    friends: users ? users : null,
                    user: req.user ? req.user : null
                });
            });
    },
    userMessagess: (req, res, next) => {
       Users
            .findById(req.user._id)
            .populate('friends avatar')
            .exec((err, user) => {
                if (err)  helpers.newError(err.msg, 500, (error) => { return next(error) });
                if (!user) helpers.newError("User not found", 404, (error) => { return next(error) });
                user.deepPopulate('friends.avatar', (err, user) => {
                    if (err)  helpers.newError(err.msg, 500, (error) => { return next(error) });
                    res.render('dialogs.ejs', {
                        user: user ? user : null
                    });
                });
            })
    }
};



