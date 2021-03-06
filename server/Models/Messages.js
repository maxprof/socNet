'use strict';

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var messageSchema = new mongoose.Schema({
    message: String,
    author: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    getter: String,
    room: String,
    status: {
        type: Boolean,
        default: false
    },
    date: String
});

messageSchema.plugin(deepPopulate, {
    populate: {
        'author': {
            select: 'avatar name surname'
        }
    }
});

module.exports = mongoose.model('Message', messageSchema);