'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var deepPopulate = require('mongoose-deep-populate')(_mongoose2.default);

var newsSchema = new _mongoose2.default.Schema({
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
    repost_count: { type: Number, default: 0 },
    repost_persons: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

exports.default = _mongoose2.default.model('News', newsSchema);