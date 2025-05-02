const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name must be provided'],
    },
    email: {
        type: String,
        match: [/\S+@\S+\.\S+/, 'Email is not valid'],
        required: [true, 'Email must be provided'],
        unique: true,
    },
    phone: {
        type: String,
        match: [/^\d{10}$/, "Phone must be 10 digits"],
        required: [true, 'Phone must be provided'],
    },
    address: {
        addressLine1: {
            type: String,
            required: true,
        },
        addressLine2: {
            type: String,
            required: false,
        },
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        zip: {
            type: String,
            required: true,
        },
    },
    password: {
        type: String,
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/, 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'],
        required: [true, 'password must be provided'],
    },
    ipaddress: {
        type: String,
        required: true,
    },
    // lastLogin: {
    //     type: Date
    // },
}, { timestamps: true });


userSchema.statics.hashPassword = function (plainPassword) {
    return bcrypt.hashSync(plainPassword, 10); // 10 is the salt rounds
};


userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compareSync(plainPassword, this.password);
};

module.exports = mongoose.model('UserM', userSchema);