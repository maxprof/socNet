import mongoose from 'mongoose';
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const groupSchema = new mongoose.Schema({
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    title: String,
    description: String,
    date: Date,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    avatar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }
});

groupSchema.plugin(deepPopulate, {
    populate: {
        'posts.creator': {
            select: 'avatar name surname'
        },
        'posts.creator.avatar': {
            select: 'name path'
        },
        'admins': {
            select: 'name surname path avatar'
        },
        'admins.avatar': {
            select: 'name path'
        },
        'subscribers': {
            select: '_id name surname path avatar'
        },
        'subscribers.avatar': {
            select: 'name path'
        },
        'posts.photo': {
            select: 'name path'
        }
    }
});

export default mongoose.model('Group', groupSchema);