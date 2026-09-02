const test = require('node:test');
const assert = require('node:assert/strict');
const Todo = require('../models/todos');

test('erstellt ein Todo mit den erwarteten Werten', () => {
    const todo = new Todo({
        status: 'offen',
        todoName: 'Testaufgabe',
        prio: 'hoch',
        datum: '2026-08-28',
        user_id: 'user-1'
    });

    assert.equal(todo.status, 'offen');
    assert.equal(todo.todoName, 'Testaufgabe');
    assert.equal(todo.prio, 'hoch');
    assert.equal(todo.datum, '2026-08-28');
    assert.equal(todo.user_id, 'user-1');
});