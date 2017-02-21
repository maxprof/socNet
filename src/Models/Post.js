import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: String,
    description: String,
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: Date,
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    likes_count: {type: Number, default: 0},
    likes_persons: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }
});
export default mongoose.model('Post', postSchema);