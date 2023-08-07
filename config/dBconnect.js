const mongoose = require('mongoose');
const dbconnect = async() => {
    console.log(process.env);
    try {
        await mongoose.connect('mongodb+srv://srijanpratihar19:srk@cluster0.ao5sugn.mongodb.net/');
        console.log('db connected');
    } catch (error) {
        ConnectionClosedEvent.log(error);
    }
};
module.exports = dbconnect;
dbconnect();