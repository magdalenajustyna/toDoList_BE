const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const Todo = require('../models/todos');

let mongoServer;

// startet Instanz einer echten MongoDB im RAM
// erhötes Zeitlimit, damit Jest nicht auf Github Actions zu früh abbricht (Dauer Download der MongoDB-Datei)
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'todolist_test' });
}, 30000);

// RAM-MongoDB wieder herunterfahren, damit Jest nicht hängen bleibt (Testprozess beenden)
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// löscht Todos, damit Tests sich nicht beeinflussen
beforeEach(async () => {
    await Todo.deleteMany({});
});

test('POST /todos/todo legt ein Todo an und speichert es dauerhaft', async () => {
    const response = await request(app)
        .post('/todos/todo')
        .send({
            status: 'offen',
            todoName: 'Einkaufen gehen',
            prio: 'hoch',
            datum: '2026-09-10',
            user_id: 'user-1'
        });

    expect(response.status).toBe(200);
    expect(response.body.todoName).toBe('Einkaufen gehen');
    expect(response.body._id).toBeDefined();

    const gespeichert = await Todo.findById(response.body._id);
    expect(gespeichert).not.toBeNull();
    expect(gespeichert.status).toBe('offen');
    expect(gespeichert.todoName).toBe('Einkaufen gehen');
    expect(gespeichert.prio).toBe('hoch');
    expect(gespeichert.datum).toBe('2026-09-10');
    expect(gespeichert.user_id).toBe('user-1');
});

test('GET /todos/todo/:id liefert das angefragte Todo', async () => {
    const angelegt = await Todo.create({
        status: 'offen',
        todoName: 'Blumen gießen',
        prio: 'mittel',
        datum: '2026-09-13',
        user_id: 'user-1'
    });

    const response = await request(app).get(`/todos/todo/${angelegt._id}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(angelegt._id.toString());
    expect(response.body.status).toBe('offen');
    expect(response.body.todoName).toBe('Blumen gießen');
    expect(response.body.prio).toBe('mittel');
    expect(response.body.datum).toBe('2026-09-13');
    expect(response.body.user_id).toBe('user-1');
});

test('GET /todos/todo/:id liefert 404 für eine unbekannte ID', async () => {
    const unbekannteId = new mongoose.Types.ObjectId();

    const response = await request(app).get(`/todos/todo/${unbekannteId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Todo does not exist!');
});

test('PATCH /todos/todo/:id markiert ein Todo als erledigt', async () => {
    const angelegt = await Todo.create({
        status: 'offen',
        todoName: 'Wäsche waschen',
        prio: 'mittel',
        datum: '2026-09-11',
        user_id: 'user-1'
    });

    const response = await request(app)
        .patch(`/todos/todo/${angelegt._id}`)
        .send({ status: 'erledigt' });

    expect(response.status).toBe(200);

    const geaendert = await Todo.findById(angelegt._id);
    expect(geaendert.status).toBe('erledigt');
    expect(geaendert.todoName).toBe('Wäsche waschen');
    expect(geaendert.prio).toBe('mittel');
    expect(geaendert.datum).toBe('2026-09-11');
    expect(geaendert.user_id).toBe('user-1');
});

test('PATCH /todos/todo/:id liefert 404 für eine unbekannte ID', async () => {
    const unbekannteId = new mongoose.Types.ObjectId();

    const response = await request(app)
        .patch(`/todos/todo/${unbekannteId}`)
        .send({ status: 'erledigt' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Todo does not exist!');
});

test('DELETE /todos/todo/:id löscht ein Todo', async () => {
    const angelegt = await Todo.create({
        status: 'offen',
        todoName: 'Müll rausbringen',
        prio: 'niedrig',
        datum: '2026-09-12',
        user_id: 'user-1'
    });

    const response = await request(app).delete(`/todos/todo/${angelegt._id}`);

    expect(response.status).toBe(204);

    const geloescht = await Todo.findById(angelegt._id);
    expect(geloescht).toBeNull();
});