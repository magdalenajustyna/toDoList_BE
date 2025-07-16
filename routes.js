const express = require('express');
const router = express.Router();
const Todo = require('./models/todos');

// get all todos        funtkioniert
router.get('/todos', async(req, res) => {
    const allTodos = await Todo.find();
    console.log(allTodos);
    res.send(allTodos);
});

// post one todo funktioniert
router.post('/todos', async(req, res) => {
    
    const newTodo = new Todo({          // Werte aus request Objekt auslesen
        status: req.body.status,
        todoName: req.body.todoName,
        prio: req.body.prio,
        datum: req.body.datum
    })
    await newTodo.save();
    res.send(newTodo);
});

// get one todo via id funktioniert
// :name des Parameters (hat Bedeutung), wird wieder aus request Objekt ausgelesen
router.get('/todos/:id', async(req, res) => {        
    let id = req.params.id; // id aus der URL holen (Parameter so bennen wie auch tatsächlich gesucht wird)
    
    // find gibt Array 
    //findOne gibt null zurück 
    let todo = await Todo.findOne({ _id : req.params.id}); // Objekte in der Datenbank suchen, die mit der id übereinstimmen
   
    if(todo) {
        res.send(todo);
    } 
    else {
        res.status(404);
        res.send({
            error: "Todo does not exist!"
        });
    }
})

// update one todo // nicht zwingend vollständiges Objekt übergeben, sondern auch nur einzelne Attribute //funktioniert
router.patch('/todos/:id', async(req, res) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id })

        if (req.body.status) {       //ACHTUNG: Status wird nur über den RadioButton geändert
           todo.status = req.body.status
        }

        if (req.body.todoName) {
            todo.todoName = req.body.todoName       
        }

        if (req.body.prio) {
            todo.prio = req.body.prio
        }

        if (req.body.datum) {
            todo.datum = req.body.datum
        }

        await Todo.updateOne({ _id: req.params.id }, todo);
        res.send(todo)
    } catch {
        res.status(404)
        res.send({ error: "Todo does not exist!" })
    }
});

// delete one to do via id funktioniert 
router.delete('/todos/:id', async(req, res) => {
    
    try {
        await Todo.deleteOne({ _id: req.params.id })
        res.status(204).send()              // status 204 schickt keine Meldung mit
    } catch {
        res.status(404)
        res.send({ error: "Todo does not exist!" })       
    }
});

module.exports = router;