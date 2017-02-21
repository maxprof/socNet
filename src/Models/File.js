import mongoose from 'mongoose';
const avatarSchema = new mongoose.Schema({
    creator: String,
    container: String,
    original_name: String,
    name: String,
    size: Number,
    path: String
});
export default mongoose.model('File', avatarSchema);