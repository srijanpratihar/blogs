const { timeStamp } = require('console');
const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    category: {
        type: String,
        required: true,
        enum: ["React JS", "HTML", "CSS", "NODE JS", "JAVASCRIPT", "OTHERS"]
    },
    image: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: true
    }]
}, {
    timeStamp: true
});


const Post = mongoose.model("Post", postSchema);
module.exports = Post;