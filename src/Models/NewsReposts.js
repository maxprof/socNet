import mongoose from 'mongoose';

const repostsSchema = new mongoose.Schema({
    user_id:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News'
    },
    news_id:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News'
    },
    data: { type: Date, default: Date.now }
});

export default mongoose.model('NewsReposts', repostsSchema);