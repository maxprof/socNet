let env = process.env.NODE_ENV || 'dev';

var config = {
    production: {
    },
    dev: {
        port: process.env.PORT || 5000,
        db: 'mongodb://localhost:27017/SocNet',
        sessionSecret: 'superSecret',
        tokenName: 'superToken',
        files: 'public/uploads'
    }
};


module.exports = config[env];