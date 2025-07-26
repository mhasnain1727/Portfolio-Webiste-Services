const User = require('../models/userM')
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const checkConnection = (req, res) => {
    res.status(200).json({ msg: 'Check connection success' });
}

const registerUser = async (req, res) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(200).json({ msg: "User already exists with this email" });
        }

        // Step 1: Check if password and confirmPassword match
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(200).json({ msg: "Password and Confirm Password do not match" });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Create new user
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            userType: req.body.userType,
            // address: {
            //     addressLine1: req.body.address?.addressLine1,
            //     addressLine2: req.body.address?.addressLine2,
            //     street: req.body.address?.street,
            //     city: req.body.address?.city,
            //     state: req.body.address?.state,
            //     country: req.body.address?.country,
            //     zip: req.body.address?.zip,
            // },
            photo: req.body.photo,
            // password: req.body.password,
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
        res.status(500).json({ msg: "Something went wrong. Please try again." });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ msg: 'Invalid email' });
        }

        const isMatch = user.comparePassword(password);

        if (!isMatch) {
            return res.status(200).json({ msg: 'Invalid password' });
        }

        // Create JWT payload
        const payload = {
            userId: user._id,
            email: user.email,
            userType: user.userType
        };
        // const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        //     expiresIn: process.env.JWT_EXPIRES_ACCESS_TOKEN_IN || '60sec',
        // });


        // Generate tokens
        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );


        // const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        //     expiresIn: process.env.JWT_EXPIRES_REFRESH_TOKEN_IN || '1d',
        // });

        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
        );

        // // Update or add refresh token and update timestamp in the user's record
        // const val = await User.findByIdAndUpdate(
        //     user._id,
        //     { 
        //     refreshToken,
        //     // lastLogin: new Date() // Update the timestamp to the current time
        //     },
        //     { new: true, upsert: true } // upsert ensures it creates the field if it doesn't exist
        // );


        const userAgent = req.headers['user-agent']; // Get device info
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // user.refreshToken = refreshToken; // for single device
        // user.refreshTokens.push(refreshToken); // for multiple device
        user.refreshTokens.push({
            token: refreshToken,
            device: userAgent,
            ipAddress: ip
        });
        await user.save();


        // Set refreshToken in secure HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });


        res.status(200).json({
            msg: 'Login successful',
            accessToken,
            user: {
                name: user.name,
                email: user.email,
                photo: user.photo,
                userType: user.userType,
                phone: user.phone,
            },
        });


    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ msg: 'No refresh token' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findOne({ email: decoded.email, refreshToken });

        // //for single device
        // if (!user) return res.status(403).json({ msg: 'Invalid refresh token' });

        // for multiple device
        const isTokenValid = user.refreshTokens.some(rt => rt.token === refreshToken);

        if (!user || !isTokenValid) {
            return res.status(401).json({ msg: 'Refresh token not recognized' });
        }

        // Create JWT payload
        const payload = {
            userId: user._id,
            email: user.email,
            userType: user.userType
        };

        const newAccessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        // res.json({ accessToken: newAccessToken });

        res.status(200).json({
            msg: 'success',
            accessToken: newAccessToken,
            user: {
                name: user.name,
                email: user.email,
                photo: user.photo,
                userType: user.userType,
                phone: user.phone,
            },
        });

    } catch (err) {
        res.status(401).json({ msg: 'Refresh token expired or invalid' });
    }
};

const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) return res.sendStatus(204).json({ msg: 'Already logged out' }); // No content, already logged out


        // Optional: Find user and clear stored refresh token in DB
        const decoded = jwt.decode(refreshToken);

        // for multiple device 
        const user = await User.findOne({ email: decoded.email, refreshToken });

        // const user = await User.findOne({ refreshTokens: refreshToken });
        if (user) {
            // const isTokenValid = user.refreshTokens.some(rt => rt.token === refreshToken);
            user.refreshTokens = user.refreshTokens.filter(val => val?.token !== refreshToken);
            await user.save();
        }

        // // for single device 
        // const user = await User.findOne({ refreshToken });
        // if (user) {
        //   user.refreshToken = null;
        //   await user.save();
        // }

        // Clear refreshToken cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        });

        res.status(200).json({ msg: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Something went wrong during logout' });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // exclude password
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
}

const updateUser = async (req, res) => {
    const { email, fullName, phone, password, photo } = req.body;

    if (!email) {
        return res.status(200).json({ msg: 'Email is required for update' });
    }

    try {
        const updateData = {
            name: fullName,
            phone: phone,
            photo: photo
        };

        // Only update password if provided
        if (password) {
            updateData.password = User.hashPassword(req.body.password);
        }

        if (!(photo == null || photo == undefined || photo == '')) {
            updateData.photo = req.body.photo;
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(200).json({ msg: 'User not found' });
        }

        res.status(200).json({
            msg: 'Profile updated successfully',
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                photo: updatedUser.photo,
                userType: updatedUser.userType,
                phone: updatedUser.phone,
            },
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
}

const getActiveSessions = async (req, res) => {
    const { email } = req.body;

    if (req.body.email !== req.user.email) return res.status(401).json({ msg: 'Invalid request' })
    // const user = await User.findOne({ email: req.body.email });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const sessions = user.refreshTokens.map((t, index) => ({
        ipAddress: t.ipAddress ? t.ipAddress : 'N/A',
        device: t.device,
        createdAt: t.createdAt,
        id: t._id  // for UI usage
    }));

    // res.status(200).json({ sessions });
    res.status(200).json({
        msg: 'Success',
        sessions: sessions
    });
};

const revokeSession = async (req, res) => {
    const { sessionId } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const findSession = user.refreshTokens.some(val => val?._id?.toString() == sessionId)

    if (!user || !findSession) {
        return res.status(400).json({ msg: 'Invalid session' });
    }

    if (user) {
        user.refreshTokens = user.refreshTokens.filter(val => val?._id?.toString() !== sessionId);
        await user.save();
    }

    // user.refreshTokens.splice(sessionIndex, 1);
    // await user.save();

    res.status(200).json({ msg: 'Session revoked' });
};


module.exports = {
    checkConnection,
    registerUser,
    refreshToken,
    loginUser,
    logoutUser,
    getAllUsers,
    updateUser,
    getActiveSessions,
    revokeSession
}