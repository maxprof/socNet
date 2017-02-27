'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var deepPopulate = require('mongoose-deep-populate')(_mongoose2.default);

var userSchema = new _mongoose2.default.Schema({
    email: {
        unique: true,
        type: String
    },
    pass: String,
    name: String,
    surname: String,
    gender: String,
    messages: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    friendsRequests: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friends: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    avatar: {
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'File'
    },
    groups: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    my_groups: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    token: String,
    blacklist: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    news: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'News'
    }],
    news_reposts: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'NewsReposts'
    }],
    subscribers: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    posts: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    date: String
});

userSchema.methods.generateHash = function (pass) {
    return _bcryptNodejs2.default.hashSync(pass, _bcryptNodejs2.default.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (pass, done) {
    _bcryptNodejs2.default.compare(pass, this.pass, function (err, is) {
        done(null, is);
    });
};

userSchema.plugin(deepPopulate, {
    populate: {
        'news.creator': {
            select: 'avatar name surname'
        },
        'news.creator.avatar': {
            select: 'name path'
        },
        'news.photo': {
            select: 'name surname path'
        },
        'friends.avatar': {
            select: 'name path'
        },
        'news_reposts.user_id': {
            select: 'name surname avatar'
        },
        'news_reposts.user_id.avatar': {
            select: 'path'
        },
        'news_reposts.news_id': {
            select: 'title description date creator photo repost_count likes_count likes_persons repost_persons'
        },
        'news_reposts.news_id.photo': {
            select: 'path'
        },
        'news_reposts.news_id.creator': {
            select: 'name surname avatar'
        },
        'news_reposts.news_id.creator.avatar': {
            select: 'name path'
        },
        'subscribers': {
            select: 'name surname avatar'
        },
        'subscribers.avatar': {
            select: 'name path'
        },
        'friendsRequests': {
            select: 'name surname avatar'
        },
        'friendsRequests.avatar': {
            select: 'name path'
        }
    }
});

exports.default = _mongoose2.default.model('User', userSchema);