const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    email: String,
    passwort: String,    
});

module.exports = mongoose.model('Users', schema);      //'users' ist Name der Datenbank Collection