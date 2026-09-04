// tests/todoManagement.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

let server;
let userId = ''; 
let todoId = ''; 
let token = ''; 

beforeAll(async () => {
    // HTTP_Server wird auf Port 4000 gestartet,um Test auszuführen
  server = app.listen(4000, () => {
    console.log('Test server running on port 4000');
  });

  // Registrierung des Benutzers
  try {
    const registrationRes = await request(app)
      .post('/todos/user/register')
      .send({
        email: 'testuser-for-todos@example.com',
        passwort: 'yourpassword',
        name: 'Test User'
      });

    expect(registrationRes.statusCode).toEqual(201);
    expect(registrationRes.body).toHaveProperty('_id');
    userId = registrationRes.body._id;
  } catch (err) {
    console.error('Error during test user registration:', err);
  }
});

afterAll(async() => {
    // Server after all schließen
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('Test server closed');
  }
  // Sicherstellen, dass das To-Do entfernt wurde
  if (todoId) {
    try {
      const todo = await mongoose.connection.collection('todos').findOne({ _id: new mongoose.Types.ObjectId(todoId) });
      if (!todo) {
        console.log('Test todo successfully removed');
      } else {
        console.error('Test todo was not removed');
      }
    } catch (err) {
      console.error('Error verifying test todo removal:', err);
    }
  }
// Test User löschen
  if (userId) {
    try {
      await mongoose.connection.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
      console.log('Test user removed'); // löschen des Testuser
    } catch (err) {
      console.error('Error removing test user:', err);
    }
  }
// DB schließen
  try {
    await mongoose.connection.close(); // DB schließen, um Störungen zu vermeiden
    console.log('Mongoose connection closed');
  } catch (err) {
    console.error('Error closing Mongoose connection:', err);
  }
});

describe('Todo Management Scenario', () => {
  it('should log in the user', async () => {
    const res = await request(app)
      .post('/todos/user/login') // Post Endpunkt wird aufgerufen, um User einzuloggen
      .send({
        email: 'testuser-for-todos@example.com', // mitschicken Email & PW
        passwort: 'yourpassword'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // speichern den token, wenn erfolgreich, für spätere Anfragen
  });
  // to do erstellung, neues to do wird erzeugt
  it('should create a todo for management', async () => {
    const createRes = await request(app)
      .post('/todos/todo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Pending',
        todoName: 'Manage this Todo',
        prio: 'Medium',
        datum: '2026-12-01',
      });

    expect(createRes.statusCode).toEqual(201); // Stauscode created
    expect(createRes.body).toHaveProperty('_id');
    todoId = createRes.body._id; // Speichern der to do id
  });

  it('should update the todo status to archived', async () => {
    const archiveRes = await request(app)
      .patch(`/todos/todo/${todoId}`) // eben erstelltes to do wird anhand id ermittelt
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'erledigt'  // und Status auf erledigt gesetzt, Annahme: 'erledigt' ist der Status für archiviert
      });

    expect(archiveRes.statusCode).toEqual(200); // OK
    expect(archiveRes.body).toHaveProperty('status', 'erledigt');
  });
// bestehendes to do wird verändert, Status und Name aktualisiert
  it('should update an existing todo', async () => {
    const updateRes = await request(app)
      .patch(`/todos/todo/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'offen', // wieder offen
        todoName: 'Updated Todo Name' // Name des to do geändert
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body).toHaveProperty('status', 'offen');
    expect(updateRes.body).toHaveProperty('todoName', 'Updated Todo Name');
  });
// löschen des angelegten to dos
  it('should delete the created todo', async () => {
    const deleteRes = await request(app)
      .delete(`/todos/todo/${todoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toEqual(204); // 204 No Content für eine erfolgreiche Löschung
  });
});
