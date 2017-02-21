'use strict';

/**
 * Created by MaxGTa on 11.02.2017.
 */
var mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    title: String,
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    private: Boolean,
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('Room', roomSchema);