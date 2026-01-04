const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    confirmPassword: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now()
    },

    verificationToken: String,
    verificationTokenExpiresAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpiresAt: Date
}, { timestamps: true })

const User = mongoose.model('user', userSchema)

module.exports = User