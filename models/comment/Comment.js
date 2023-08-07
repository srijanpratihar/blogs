const { timeStamp } = require('console');
const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: {
        type: String,
        required: true,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    }
}, {
    timeStamp: true
});


const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;