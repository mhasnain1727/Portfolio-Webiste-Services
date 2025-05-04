const User = require('../models/userM')
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
// const { uploadPic } = require('../upload/profilePic');

const checkConnection = (req, res) => {
    console.log("Check connection called")
    res.status(200).json({ msg: 'Check connection success' });
}

const registerUser = async (req, res) => {
    try {
        console.log("Register user called", req.body);
        // console.log("Register user file", req.file);

        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ msg: "User already exists with this email" });
        }

        // Step 1: Check if password and confirmPassword match
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({ msg: "Password and Confirm Password do not match" });
        }

        // let filePath = null;
        // uploadPic(req, res, async (err) => {
        //     if (err) {
        //         return res.status(400).json({ msg: err.message });
        //     } else {
        //         // File uploaded successfully, get the file path
        //         filePath = req.file.path;
        //         console.log("File path:", filePath);
        //     }
        // })

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Create new user
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address: {
                addressLine1: req.body.address?.addressLine1,
                addressLine2: req.body.address?.addressLine2,
                street: req.body.address?.street,
                city: req.body.address?.city,
                state: req.body.address?.state,
                country: req.body.address?.country,
                zip: req.body.address?.zip,
            },
            // profilePic: req?.file?.path,
            // photoPath: filePath,
            password: User.hashPassword(req.body.password),
            ipaddress: ip,
        });

        // Save user (triggers validation)
        await user.save();

        res.status(201).json({ msg: "User successfully registered" });

    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ errors: validationErrors });
        }

        console.error("Unexpected error during registration:", error);
        res.status(500).json({ msg: "Something went wrong. Please try again." });
    }
};


const loginUser = async (req, res) => {
    console.log("Login user called", req.body);
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid email' });
        }

        const isMatch = user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid password' });
        }

        // Create JWT payload
        const payload = {
            userId: user._id,
            email: user.email,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_ACCESS_TOKEN_IN || '60sec',
        });
        // const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        //     expiresIn: process.env.JWT_EXPIRES_REFRESH_TOKEN_IN || '1d',
        // });

        // // Update or add refresh token and update timestamp in the user's record
        // const val = await User.findByIdAndUpdate(
        //     user._id,
        //     { 
        //     refreshToken,
        //     // lastLogin: new Date() // Update the timestamp to the current time
        //     },
        //     { new: true, upsert: true } // upsert ensures it creates the field if it doesn't exist
        // );


        res.status(200).json({
            msg: 'Login successful',
            accessToken,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ msg: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password -_id -createdAt -updatedAt -__v'); // exclude password
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
}


module.exports = {
    checkConnection,
    registerUser,
    loginUser,
    getAllUsers
}