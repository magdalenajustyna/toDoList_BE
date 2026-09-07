const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const usersRoutes = require('./usersRoutes');

const app = express();

app.use(express.json());
// enable cors for all requests
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200'
}));
app.use('/todos/todo', routes);
app.use('/todos/user', usersRoutes);

module.exports = app;
