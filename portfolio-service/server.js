require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/connectionSetup');
const bodyParser = require('body-parser');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3000;
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const startServer = async () => {
    try {
        await db();
        app.use(cors({ origin: 'http://localhost:4200', credentials: true })); //Add credentials true for cookie
        // app.use(cors({ origin: true, credentials: true })); // Allow all origins with credentials

        app.use(bodyParser.json());
        app.use(cookieParser());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use('/api', require('./routes/userR'));
        
        // setupSwagger(app);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        app.listen(PORT, () => {
        console.log(`Portfolio service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer();