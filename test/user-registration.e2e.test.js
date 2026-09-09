// tests/userRegistrationAndFirstTodo.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Importiert das Express-App-Objekt, wie es ist
require('dotenv').config();

const testEmail = 'testuser4@example.com';
let todoId = '';
let userId = ''; // ID des erstellten Benutzers
let token = '';

  // Bereinigung: Testbenutzer in der bestehenden Datenbankverbindung entfernen
 // Entferne Testbenutzer vor Beginn der Tests
 beforeAll(async () => {
  await mongoose.connect(process.env.DB_CONNECTION); // Verbindung zur DB herstellen

  // Entferne Testbenutzer vor Beginn der Tests
  // Vorherige Testdaten entfernen
  await mongoose.connection.collection('users').deleteOne({
    email: testEmail
  });

  console.log(`Existing test user removed if present: ${testEmail}`);
});



//nach Test Server wieder herunterfahren
afterAll(async() => {
 // Test-To-do entfernen
  if (todoId) {
    try {
      await mongoose.connection.collection('todos').deleteOne({
        _id: new mongoose.Types.ObjectId(todoId)
      });

      console.log('Test todo removed');
    } catch (err) {
      console.error('Error removing test todo:', err);
    }
  }

  // Testbenutzer entfernen
  if (userId) {
    try {
      await mongoose.connection.collection('users').deleteOne({
        _id: new mongoose.Types.ObjectId(userId)
      });

      console.log('Test user removed');
    } catch (err) {
      console.error('Error removing test user:', err);
    }
  }

  // Datenbankverbindung schließen
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('Mongoose connection closed');
  }
});


describe('User Registration and First Todo Scenario', () => {
  // Registrierung eines neuen Benutzers
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/todos/user/register')
      .send({
        email: testEmail,
        passwort: 'yourpassword',
        name: 'Test User4'
      });
    
    console.log('Registration status:', res.statusCode);
    console.log('Registration body:', res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');  // Die ID des neu erstellten Benutzers
    userId = res.body._id;  // Speichere die Benutzer-ID
  });

  // Anmeldung des Benutzers
  it('should log in the user', async () => {
    const res = await request(app)
      .post('/todos/user/login')
      .send({
        email: testEmail,
        passwort: 'yourpassword'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;  // JWT-Token sichern für nachfolgende Anfragen
  });

  // Erstellung eines neuen To-Do
  it('should create a new todo', async () => {
    const res = await request(app)
      .post('/todos/todo')
      .set('Authorization', `Bearer ${token}`)  // Token im Header für die Autorisierung
      .send({
        status: 'Pending',
        todoName: 'Write E2E Test',
        prio: 'High',
        datum: '2026-10-11',
        user_id: userId
      });
    console.log('Create todo status:', res.statusCode);
    console.log('Create todo body:', res.body);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.todoName).toBe('Write E2E Test');
   todoId = res.body._id;
  });

  /*
  // Abmeldung des Benutzers - 
  // Logout-Verfahren rein clientseitig und nicht mit einem spezifischen serverseitigen Endpunkt verbunden
  it('should log out the user', async () => {
    const res = await request(app)
      .post('/todos/user/logout')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
  });
  */



 
});