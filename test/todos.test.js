const Todo = require('../models/todos');

test('erstellt ein Todo mit den erwarteten Werten', () => {
    const todo = new Todo({
        status: 'offen',
        todoName: 'Testaufgabe',
        prio: 'hoch',
        datum: '2026-08-28',
        user_id: 'user-1'
    });

    expect(todo.status).toBe('offen');
    expect(todo.todoName).toBe('Testaufgabe');
    expect(todo.prio).toBe('hoch');
    expect(todo.datum).toBe('2026-08-28');
    expect(todo.user_id).toBe('user-1');
});