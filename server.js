require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

function getPort() {
    const port = Number(process.env.PORT) || 8080;
    return port;
}

// connect to mongoDB
function connectToDatabase() {
    mongoose.connect(process.env.DB_CONNECTION, { dbName: process.env.DATABASE });

    const db = mongoose.connection;
    db.on('error', err => {
        console.log(err);
    });
    db.once('open', () => {
        console.log('connected to DB');
    });
}

function start() {
    connectToDatabase();

    const port = getPort();
    return app.listen(port, '0.0.0.0', (error) => {
        if (error) {
            console.log(error);
        } else {
            console.log(`Server started and listening on port ${port} ... `);
        }
    });
}

// Nur starten, wenn diese Datei direkt ausgeführt wird (node server.js).
// Beim Import aus einem Test passiert nichts.
if (require.main === module) {
    start();
}

module.exports = { getPort, start };
