const express = require('express');
const routes = require('./routes');
const usersRoutes = require('./usersRoutes');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

function getPort() {
    const port = Number(process.env.PORT) || 8080;
    return port;
}

const PORT = getPort();

app.use(express.json());
// enable cors for all requests
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use('/todos/todo', routes);
app.use('/todos/user', usersRoutes);

// connect to mongoDB
mongoose.connect(process.env.DB_CONNECTION, { dbName: process.env.DATABASE });
const db = mongoose.connection;
db.on('error', err => {
  console.log(err);
});
db.once('open', () => {
    console.log('connected to DB');
});

app.listen(PORT, '0.0.0.0', (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log(`Server started and listening on port ${PORT} ... `);
    }
});

module.exports = { getPort };