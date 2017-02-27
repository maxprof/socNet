import mongoose from 'mongoose';

const repostsSchema = new mongoose.Schema({
    user_id:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    news_id:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News'
    },
    date: { type: Date, default: Date.now }
});

export default mongoose.model('NewsReposts', repostsSchema);