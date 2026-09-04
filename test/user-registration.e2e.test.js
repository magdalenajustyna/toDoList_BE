// tests/userRegistrationAndFirstTodo.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Importiert das Express-App-Objekt, wie es ist
// Workaround Server-Start wird im Test simuliert
let server;
let userId = ''; // ID des erstellten Benutzers


  // Bereinigung: Testbenutzer in der bestehenden Datenbankverbindung entfernen
 // Entferne Testbenutzer vor Beginn der Tests
 beforeAll(async () => {
  server = app.listen(4000, () => {
    console.log('Test server running on port 4000');
  });

  // Entferne Testbenutzer vor Beginn der Tests
  try {
    const testEmail = 'testuser4@example.com';
    const res = await request(app)
      .delete(`/users/email/${testEmail}`);
    
    if (res.statusCode === 204) {
      console.log(`Deleted test user with email: ${testEmail}`);
    } else {
      console.log(`No test user to delete or error occurred for email: ${testEmail}`);
    }
  } catch (err) {
    console.error('Error during test user deletion:', err);
  }
});


//nach Test Server wieder herunterfahren
afterAll(async() => {
  // Server schließen
  if (server) {
   // server.close();
   await new Promise((resolve) => server.close(resolve));
      console.log('Test server closed');
      //done(); // Verwende den Callback, um sicherzustellen, dass Jest das Schließen erkennt.
    }
  

  // Cleanup: Test-User aus der Datenbank entfernen
  // um ein neues ObjectID -Object zu erstellen benötigen wir schlüsselwort new
  if (userId) {
    try{
      await
    mongoose.connection.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
      console.log('Test user removed');
   
    //.finally(() => mongoose.connection.close());
    }catch(err) {
        console.error('Error removing test user:', err);
      }
    }
    // Schließe die Mongoose-Verbindung ordentlich ab
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed');
  } catch (err) {
    console.error('Error closing Mongoose connection:', err);
  }
});


describe('User Registration and First Todo Scenario', () => {
  let token = '';  // Speichern des JWT-Tokens
  //let userId = ''; // ID des erstellten Benutzers

  // Registrierung eines neuen Benutzers
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/todos/user/register')
      .send({
        email: 'testuser4@example.com',
        passwort: 'yourpassword',
        name: 'Test User4'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');  // Die ID des neu erstellten Benutzers
    userId = res.body._id;  // Speichere die Benutzer-ID
  });

  // Anmeldung des Benutzers
  it('should log in the user', async () => {
    const res = await request(app)
      .post('/todos/user/login')
      .send({
        email: 'testuser4@example.com',
        passwort: 'yourpassword'
      });
    
    expect(res.statusCode).toEqual(200);
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
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.todoName).toBe('Write E2E Test');
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