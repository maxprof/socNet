module.exports = app => {
    let path = require('path');
    let async = require('async');
    let main_controller = require('../controllers/main.js');
    let helpers = require('../config/helpers.js');
    app.all('*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
        if (req.method == 'OPTIONS') {
            res.status(200).end();
        } else {
            next();
        }
    });
    app.get('/',  helpers.tokenInspection, main_controller.home);
    app.post('/user/signup',  main_controller.UserSignupPost);
    app.get('/user/signup', main_controller.UserSignup);
    app.get('/user/login',  main_controller.login);
    app.post('/user/login', main_controller.Postlogin);
    app.get('/logout', main_controller.logout);
    app.get('/users', helpers.tokenInspection, main_controller.users);

    app.get('/sess', helpers.tokenInspection, main_controller.sess);
    app.get('/user/id:id',helpers.profileInspection, main_controller.userProfile);
    app.get('/user/settings', helpers.profileInspection, helpers.tokenInspection, main_controller.settings);
    app.post('/user/settings', helpers.profileInspection, helpers.tokenInspection, main_controller.settingsPost);
    app.post('/avatar', helpers.profileInspection, main_controller.avatar);
    app.post('/news/new', helpers.profileInspection, main_controller.newsNewPost);
    app.post('/news/edit/id:id', main_controller.editNewsPost);
    app.delete('/news/delete/id:id', main_controller.deleteNews);
    app.post('/news/like/id:id', helpers.tokenInspection, main_controller.newsLike);
    app.post('/news/repost',  helpers.profileInspection, main_controller.repostNews);

    app.get('/group/id:id',  helpers.profileInspection, main_controller.getGroup);
    app.get('/user/groups', helpers.tokenInspection, main_controller.getMyGroups);
    app.get('/user/groups/all', helpers.tokenInspection, main_controller.getAllGroups);
    app.get('/user/groups/admin', helpers.tokenInspection, main_controller.getMyGroupsAdmin);
    app.post('/group/new', helpers.tokenInspection, main_controller.newGroupPost);
    app.post('/group/avatar', helpers.tokenInspection, main_controller.groupAvatar);
    app.post('/group/edit', helpers.tokenInspection, main_controller.editGroup);
    app.post('/group/subscriber/add', helpers.tokenInspection, main_controller.addGroupSubscriber);
    app.post('/group/subscriber/remove', helpers.tokenInspection, main_controller.removeGroupSubscriber);

    app.post('/group/post/edit/id:id', helpers.tokenInspection, main_controller.editGroupPost);
    app.delete('/group/delete/id:id', helpers.tokenInspection, main_controller.deleteGroup);
    app.post('/post/new', helpers.tokenInspection, main_controller.postNew);
    app.post('/post/edit/id:id', helpers.tokenInspection, main_controller.editPostPost);
    app.delete('/post/delete/id:id', helpers.tokenInspection, main_controller.deletePost);
    app.post('/post/like/id:id', helpers.tokenInspection, main_controller.likePost);

    app.post('/user/friend/add',helpers.tokenInspection, main_controller.addFriend);
    app.post('/user/friend/request/remove',helpers.tokenInspection, main_controller.removeFriendRequest);
    app.post('/user/friend/remove',helpers.tokenInspection, main_controller.removeFriend);
    app.post('/user/confirm/friend', helpers.tokenInspection,  main_controller.confirmFriend);
    app.get('/friends', helpers.tokenInspection, main_controller.userFriends);

    app.get('/user/messagess', helpers.tokenInspection, main_controller.userMessagess);
    app.use((err, req, res, next) => {
        if (err) return res.status(err.status).send(err.message);
        next();
    })
};

