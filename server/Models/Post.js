'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var postSchema = new _mongoose2.default.Schema({
    title: String,
    description: String,
    creator: {
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: Date,
    photo: {
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'File'
    },
    likes_count: { type: Number, default: 0 },
    likes_persons: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }],
    group: {
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'Group'
    }
});
exports.default = _mongoose2.default.model('Post', postSchema);