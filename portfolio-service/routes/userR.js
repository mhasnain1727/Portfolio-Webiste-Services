const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

const { 
    registerUser, 
    refreshToken, 
    logoutUser, 
    updateUser, 
    checkConnection, 
    loginUser, 
    getAllUsers,
    getActiveSessions,
    revokeSession
} = require('../controller/authC');

router.get('/check', checkConnection);

router.post('/registerUser', registerUser);

router.post('/refreshToken', refreshToken);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.get('/getAllUsers', authenticateToken, getAllUsers);

router.post('/updateUser', authenticateToken, updateUser);

router.post('/allActiveSessions', authenticateToken, getActiveSessions);

router.post('/revokeSession', authenticateToken, revokeSession);



module.exports = router;