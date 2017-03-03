'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var avatarSchema = new _mongoose2.default.Schema({
    creator: String,
    container: String,
    original_name: String,
    name: String,
    size: Number,
    path: String,
    ext: String
});
exports.default = _mongoose2.default.model('File', avatarSchema);