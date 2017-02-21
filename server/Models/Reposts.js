'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var repostsSchema = new _mongoose2.default.Schema({
    reposts_count: { type: Number, default: 0 },
    reposts_persons: [{
        type: _mongoose2.default.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

exports.default = _mongoose2.default.model('NewsReposts', repostsSchema);