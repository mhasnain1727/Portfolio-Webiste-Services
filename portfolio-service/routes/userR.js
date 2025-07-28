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

/**
 * @swagger
 * /registerUser:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - userType
 *               - ipaddress
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [student, teacher]
 *               ipaddress:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: base64
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns accessToken
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /refreshToken:
 *   post:
 *     summary: Refresh the access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 *       403:
 *         description: Refresh token expired or invalid
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout user and revoke refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */

/**
 * @swagger
 * /updateUser:
 *   post:
 *     summary: Update user profile details
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: base64
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /getAllUsers:
 *   get:
 *     summary: Get all users (Admin use)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /getActiveSessions:
 *   get:
 *     summary: Get active sessions for the user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /revokeSession:
 *   post:
 *     summary: Revoke a specific session (logout from one device)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session revoked
 *       404:
 *         description: Session not found
 */

router.post('/registerUser', registerUser);

router.post('/refreshToken', refreshToken);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.get('/getAllUsers', authenticateToken, getAllUsers);

router.post('/updateUser', authenticateToken, updateUser);

router.post('/allActiveSessions', authenticateToken, getActiveSessions);

router.post('/revokeSession', authenticateToken, revokeSession);



module.exports = router;