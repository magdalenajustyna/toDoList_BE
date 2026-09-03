const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const Todo = require('../models/todos');

let mongoServer;

// Läuft einmal vor allen Tests: startet eine echte MongoDB, die nur im
// Arbeitsspeicher lebt, und verbindet Mongoose damit. Die 30 Sekunden am Ende
// sind ein erhöhtes Zeitlimit - der Start dauert etwa eine Sekunde, beim
// allerersten Mal auf einem frischen Rechner aber länger.
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'todolist_test' });
}, 30000);

// Läuft einmal nach allen Tests. Ohne dieses Aufräumen bleiben Verbindungen
// offen und der Testprozess beendet sich nicht - in GitHub Actions würde der
// Job dann bis zum Timeout weiterlaufen.
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Läuft vor jedem einzelnen Test: leert die Sammlung, damit die Tests sich
// nicht gegenseitig beeinflussen und ihre Reihenfolge egal ist.
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

    // Der eigentliche Beweis: Liegt es wirklich in der Datenbank, oder hat die
    // Route nur zurückgeschickt, was wir ihr geschickt haben?
    const gespeichert = await Todo.findById(response.body._id);
    expect(gespeichert).not.toBeNull();
    expect(gespeichert.todoName).toBe('Einkaufen gehen');
    expect(gespeichert.user_id).toBe('user-1');
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
    // Die übrigen Felder dürfen dabei nicht verloren gehen:
    expect(geaendert.todoName).toBe('Wäsche waschen');
    expect(geaendert.prio).toBe('mittel');
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
