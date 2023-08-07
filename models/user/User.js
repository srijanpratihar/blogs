const { timeStamp } = require('console');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({

    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String
    },
    coverImage: {
        type: String
    },
    role: {
        type: String,
        default: "blogger",
    },
    about: {
        type: String,
        required: true
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, {
    timeStamp: true
});


const User = mongoose.model("User", userSchema);
module.exports = User;