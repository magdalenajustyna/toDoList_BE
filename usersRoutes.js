const express = require('express');
const router = express.Router();
const User = require('./models/users');

// get all users funtkioniert
router.get('/', async(req, res) => {
    const allUsers = await User.find();
    console.log(allUsers);
    res.send(allUsers);
});

// post one user funktioniert
router.post('/', async(req, res) => {
    
    const newUser = new User({          // Werte aus request Objekt auslesen
        email: req.body.email,
        passwort: req.body.passwort,
    })
    await newUser.save();
    res.send(newUser);
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