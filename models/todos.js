const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    status: String,
    todoName: String,
    prio: String,
    datum: String,
    user_id: String

});

module.exports = mongoose.model('Todos', schema);      //'todos' ist Name der Datenbank Collection