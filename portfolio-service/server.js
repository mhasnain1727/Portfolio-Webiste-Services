require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/connectionSetup');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;


const startServer = async () => {
    try {
        await db();
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use('/api', require('./routes/userR'));
        
        app.listen(PORT, () => {
        console.log(`Portfolio service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer();