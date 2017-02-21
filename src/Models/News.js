import mongoose from 'mongoose';
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const newsSchema = new mongoose.Schema({
    title: String,
    description: String,
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: Date,
    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },
    likes_count: {type: Number, default: 0},
    likes_persons: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    repost_count: {type: Number, default: 0},
    repost_persons:  [
            {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});

export default mongoose.model('News', newsSchema);