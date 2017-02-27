import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const userSchema = new mongoose.Schema({
    email: {
        unique: true,
        type: String
    },
    pass: String,
    name: String,
    surname: String,
    gender: String,
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    friendsRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    avatar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    my_groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    token: String,
    blacklist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    news: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News'
    }],
    news_reposts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NewsReposts'
    }],
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    date : String
});

userSchema.methods.generateHash = pass => bcrypt.hashSync(pass, bcrypt.genSaltSync(8), null);

userSchema.methods.validPassword = function(pass, done) {
    bcrypt.compare(pass, this.pass, (err, is) => {
        done(null,is)
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
        'subscribers':{
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

export default mongoose.model('User', userSchema);