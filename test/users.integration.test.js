const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');

const app = require('../app');
const Todo = require('../models/todos');
const User = require('../models/users');

let mongoServer;

// startet Instanz einer echten MongoDB im RAM
// erhötes Zeitlimit, damit Jest nicht auf Github Actions zu früh abbricht (Dauer Download der MongoDB-Datei)
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'todolist_test' });
}, 30000);

// RAM-MongoDB wieder herunterfahren, damit Jest nicht hängen bleibt (Testprozess beendet)
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// leere die RAM-MongoDB
beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) {
        await collection.deleteMany({});
    }
});

test('POST /todos/user/register legt eine Nutzer:in an und speichert das Passwort verschlüsselt', async () => {
    const response = await request(app)
        .post('/todos/user/register')
        .send({ email: 'anna@test.de', passwort: 'geheim123', name: 'Anna' });

    expect(response.status).toBe(201);

    const gespeichert = await User.findOne({ email: 'anna@test.de' });
    expect(gespeichert).not.toBeNull();
    expect(gespeichert.name).toBe('Anna');

    expect(gespeichert.passwort).not.toBe('geheim123');
    expect(await bcrypt.compare('geheim123', gespeichert.passwort)).toBe(true);
});

test('POST /todos/user/register liefert 401, wenn die E-Mail schon vergeben ist', async () => {
    await User.create({
        email: 'anna@test.de',
        passwort: await bcrypt.hash('geheim123', 10),
        name: 'Anna'
    });

    const response = await request(app)
        .post('/todos/user/register')
        .send({ email: 'anna@test.de', passwort: 'anderesPasswort', name: 'Anna Zwei' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('email already exists!');
    expect(await User.countDocuments({ email: 'anna@test.de' })).toBe(1);
});

test('POST /todos/user/login liefert Token und Nutzerdaten bei korrekten Zugangsdaten', async () => {
    const angelegt = await User.create({
        email: 'anna@test.de',
        passwort: await bcrypt.hash('geheim123', 10), 
        name: 'Anna'
    });

    const response = await request(app)
        .post('/todos/user/login')
        .send({ email: 'anna@test.de', passwort: 'geheim123' });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);

    expect(response.body.user._id).toBe(angelegt._id.toString());
    expect(response.body.user.email).toBe('anna@test.de');
    expect(response.body.user.name).toBe('Anna');

    expect(response.body.user.passwort).toBeUndefined();
});

test('POST /todos/user/login liefert 401 bei falschem Passwort', async () => {
    await User.create({
        email: 'anna@test.de',
        passwort: await bcrypt.hash('geheim123', 10),
        name: 'Anna'
    });

    const response = await request(app)
        .post('/todos/user/login')
        .send({ email: 'anna@test.de', passwort: 'falschesPasswort' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email/password');
});

test('POST /todos/user/login liefert 401 bei unbekannter E-Mail', async () => {
    await User.create({
        email: 'anna@test.de',
        passwort: await bcrypt.hash('geheim123', 10),
        name: 'Anna'
    });

    const response = await request(app)
        .post('/todos/user/login')
        .send({ email: 'gibtesnicht@test.de', passwort: 'geheim123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email/password');
});

test('GET /todos/user/:id/todos liefert nur die Todos der angefragten Nutzer:in', async () => {
    await Todo.create({
        status: 'offen',
        todoName: 'Annas erstes Todo',
        prio: 'hoch',
        datum: '2026-09-10',
        user_id: 'anna'
    });
    await Todo.create({
        status: 'erledigt',
        todoName: 'Annas zweites Todo',
        prio: 'mittel',
        datum: '2026-09-11',
        user_id: 'anna'
    });
    await Todo.create({
        status: 'offen',
        todoName: 'Bens Todo',
        prio: 'niedrig',
        datum: '2026-09-12',
        user_id: 'ben'
    });

    const response = await request(app).get('/todos/user/anna/todos');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    const namen = response.body.map(todo => todo.todoName);
    expect(namen).toContain('Annas erstes Todo');
    expect(namen).toContain('Annas zweites Todo');
    expect(namen).not.toContain('Bens Todo');
});

test('GET /todos/user/:id/todos liefert ein leeres Array für eine Nutzer:in ohne Todos', async () => {
    await Todo.create({
        status: 'offen',
        todoName: 'Annas Todo',
        prio: 'hoch',
        datum: '2026-09-10',
        user_id: 'anna'
    });

    const response = await request(app).get('/todos/user/ben/todos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
});

test('GET /todos/user/:userId/todos/:todoId liefert das Todo der Nutzer:in', async () => {
    const annasTodo = await Todo.create({
        status: 'offen',
        todoName: 'Annas Einkauf',
        prio: 'hoch',
        datum: '2026-09-10',
        user_id: 'anna'
    });

    const response = await request(app).get(`/todos/user/anna/todos/${annasTodo._id}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(annasTodo._id.toString());
    expect(response.body.todoName).toBe('Annas Einkauf');
    expect(response.body.user_id).toBe('anna');
});

test('GET /todos/user/:userId/todos/:todoId gibt Annas Todo nicht an Ben heraus', async () => {
    const annasTodo = await Todo.create({
        status: 'offen',
        todoName: 'Annas Einkauf',
        prio: 'hoch',
        datum: '2026-09-10',
        user_id: 'anna'
    });

    const response = await request(app).get(`/todos/user/ben/todos/${annasTodo._id}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Todo does not exist!');
});

test('DELETE /todos/user/:id löscht die Nutzer:in', async () => {
    const angelegt = await User.create({
        email: 'anna@test.de',
        passwort: await bcrypt.hash('geheim123', 10),
        name: 'Anna'
    });

    const response = await request(app).delete(`/todos/user/${angelegt._id}`);

    expect(response.status).toBe(204);

    const geloescht = await User.findById(angelegt._id);
    expect(geloescht).toBeNull();
});

