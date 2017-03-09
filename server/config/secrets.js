'use strict';

var env = process.env.NODE_ENV || 'dev';
var MONGODB_URI = 'mongodb://heroku_58x9d265:5fr41lapckuscd4h5remlqeo54@ds019966.mlab.com:19966/heroku_58x9d265';
var config = {
    production: {},
    dev: {
        port: process.env.PORT || 5000,
        db: process.env.MONGODB_URI || MONGODB_URI || 'mongodb://localhost:27017/SocNet',
        sessionSecret: 'superSecret',
        tokenName: 'superToken',
        files: 'public/uploads'
    }
};

module.exports = config[env];