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
    news: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News'
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
        'news.creator': {
            select: 'avatar name surname'
        },
        'news.creator.avatar': {
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
        'news.photo': {
            select: 'name path'
        }
    }
});

export default mongoose.model('Group', groupSchema);