const express = require('express');
const router = express.Router();
const { uploadPic } = require('../upload/profilePic');

const { registerUser, checkConnection, loginUser, getAllUsers } = require('../controller/authC');
const authenticateToken = require('../middleware/authJWTAccessToken');

router.get('/check', checkConnection);

router.post('/registerUser', registerUser);
// router.post('/registerUser', uploadPic, registerUser);

router.post('/login', loginUser);

router.get('/getAllUsers', authenticateToken, getAllUsers);




module.exports = router;