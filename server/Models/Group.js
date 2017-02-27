'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var deepPopulate = require('mongoose-deep-populate')(_mongoose2.default);

var groupSchema = new _mongoose2.default.Schema({
    subscribers: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    title: String,
    description: String,
    date: Date,
    news: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'News'
    }],
    admins: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    avatar: {
        type: _mongoose2.default.Schema.Types.ObjectId,
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

exports.default = _mongoose2.default.model('Group', groupSchema);