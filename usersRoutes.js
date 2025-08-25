const express = require('express');
const router = express.Router();
const User = require('./models/users');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const Todo = require('./models/todos');

// get all users 
router.get('/', async(req, res) => {
    const allUsers = await User.find();
    console.log(allUsers);
    res.send(allUsers);
});

// post one user - login 
router.post('/login', async(req, res) => {

    let email = req.body.email
    let passwort = req.body.passwort   

    let user = await User.findOne({ email: email });

    if (user){
        const match = await bcrypt.compare(passwort, user.passwort);
        if (match) {
            const userWithoutPasswort = { _id : user._id , email : user.email, name : user.name } ;
            const token = jwt.sign(userWithoutPasswort, email); 
            res.status(200)
            res.send({token : token, user : userWithoutPasswort});            

        } else {
            res.status(401).send({ message: "Invalid email/password" });
        }
    }

});

// post one user - register 
router.post('/register', async(req, res) => {

    let emailVar = req.body.email
    let passwortVar = req.body.passwort
    let nameVar = req.body.name
    let hashPasswort = await bcrypt.hash(passwortVar, 10);
    console.log('hash : ', hashPasswort)

    //prüfe, ob mail schon existiert    
    let user = await User.findOne({ email: emailVar });

    if (user){      // wenn ja, dann Fehler zurückgeben

        res.status(401).send({ message: "email already exists!" });           

        } 
        
        else {      // wenn nein, dann neuen User anlegen

            const newUser = new User({

                email: emailVar,
                passwort: hashPasswort,
                name: nameVar
            })

            await newUser.save();
            res.status(201).send(newUser);
    }

});

// get one User via id 
// :name des Parameters (hat Bedeutung), wird wieder aus request Objekt ausgelesen
router.get('/:id', async(req, res) => {        
    let id = req.params.id; // id aus der URL holen (Parameter so bennen wie auch tatsächlich gesucht wird)
    
    // find gibt Array 
    //findOne gibt null zurück 
    let user = await User.findOne({ _id : req.params.id}); // Objekte in der Datenbank suchen, die mit der id übereinstimmen
   
    if(user) {
        res.send(user);
    } 
    else {
        res.status(404);
        res.send({
            error: "User does not exist!"
        });
    }
})

// get all todos for one user
router.get('/:id/todos', async(req, res) => {        
    let id = req.params.id; // id aus der URL holen (Parameter so bennen wie auch tatsächlich gesucht wird)
    
    // find gibt Array 
    //findOne gibt null zurück 

    //durchsuche todo-Datenbank nach User id
    //zeige alle ToDos an 
    let userTodos = await Todo.find({ user_id : req.params.id}) ;  // Objekte in der Datenbank suchen, die mit der id übereinstimmen
   
    if(userTodos.length > 0) {      // wenn Array befüllt ist, dann alle ToDos zurückgeben
        res.send(userTodos);        
    } 
    else {
        res.status(404);
        res.send({
            error: "Todos do not exist!"
        });
    }
})

// get one todo je userin
router.get('/:userId/todos/:todoId', async(req, res) => {        
    let userId = req.params.userId; // id aus der URL holen (Parameter so bennen wie auch tatsächlich gesucht wird)
    let todoId = req.params.todoId; // id aus der URL holen (Parameter so bennen wie auch tatsächlich gesucht wird)
    
    // find gibt Array 
    //findOne gibt null zurück 

    //durchsuche todo-Datenbank nach User id
    //zeige alle ToDos an 
    let userTodo = await Todo.findOne({ user_id : userId, _id: todoId }) ;  // Objekte in der Datenbank suchen, die mit der id übereinstimmen
   
    if(userTodo) {      // wenn Array befüllt ist, dann alle ToDos zurückgeben
        res.send(userTodo);        
    } 
    else {
        res.status(404);
        res.send({
            error: "Todo does not exist!"
        });
    }
})





// update one user // nicht zwingend vollständiges Objekt übergeben, sondern auch nur einzelne Attribute //funktioniert
router.patch('/:id', async(req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })

        if (req.body.email) {       
           user.email = req.body.email
        }

        if (req.body.passwort) {
            user.passwort = req.body.passwort       
        }

        if (req.body.name) {
            user.name = req.body.name       
        }

        await User.updateOne({ _id: req.params.id }, user);
        res.send(user)
    } catch {
        res.status(404)
        res.send({ error: "User does not exist!" })
    }
});

// delete one user via id 
router.delete('/:id', async(req, res) => {
    
    try {
        await User.deleteOne({ _id: req.params.id })
        res.status(204).send()              // status 204 schickt keine Meldung mit
    } catch {
        res.status(404)
        res.send({ error: "User does not exist!" })       
    }
});

module.exports = router;