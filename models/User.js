const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'member'
    },
    dateOfCreation: {
        type: Date,
        default: Date.now
    }
});

const User = new mongoose.model('User', UserSchema);
module.exports = User;