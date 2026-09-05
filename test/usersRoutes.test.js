// ==================== IMPORTS & MOCKS ====================
const router = require('../usersRoutes'); 

// Wir erweitern den User-Mock, damit er auch das Erstellen von Instanzen (new User) simuliert
jest.mock('../models/users', () => {
  const mockSave = jest.fn();
  function MockUser(data) {
    this.email = data.email;
    this.passwort = data.passwort;
    this.name = data.name;
    this.save = mockSave; 
    return this;
  }
  MockUser.find = jest.fn();
  MockUser.findOne = jest.fn();
  MockUser.prototype.save = mockSave; 
  return MockUser;
});

// Mock für das Todo-Model
jest.mock('../models/todos', () => ({
  find: jest.fn(),
  findOne: jest.fn() // <-- Das hat gefehlt!
}));

jest.mock('bcrypt', () => ({ 
  compare: jest.fn(),
  hash: jest.fn() 
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const User = require('../models/users'); 
const Todo = require('../models/todos'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==================== GET-TESTS ====================
describe('GET / - Get All Users', () => {
  test('sollte alle Benutzer erfolgreich zurückgeben', async () => {
    // Hier sind deine 5 Wunschnamen jetzt fest verankert!
    const mockUsers = [
      { id: 1, name: 'Anna' }, 
      { id: 2, name: 'Ben' },
      { id: 3, name: 'Gülcan' }, 
      { id: 4, name: 'Tupoka' }, 
      { id: 5, name: 'Ugur' }
    ];
    User.find.mockResolvedValue(mockUsers); 

    const req = {};
    const res = { send: jest.fn() };

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(mockUsers);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});

// ==================== POST-LOGIN TEST ====================
describe('POST /login', () => {
  let req, res;
  beforeEach(() => {
    req = { body: { email: 'test@uni.de', passwort: 'geheim123' } };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  test('Szenario 1: erfolgreicher Login', async () => {
    const mockUser = { _id: '123', email: 'test@uni.de', name: 'Max', passwort: 'hashedPassword' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake-token-123');

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/login').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      token: 'fake-token-123',
      user: { _id: '123', email: 'test@uni.de', name: 'Max' }
    });
  });

  test('Szenario 2: falsches Passwort', async () => {
    const mockUser = { _id: '123', email: 'test@uni.de', passwort: 'hashedPassword' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/login').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid email/password" });
  });

  test('Szenario 3: E-Mail nicht gefunden', async () => {
    User.findOne.mockResolvedValue(null);

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/login').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid email/password" });
  });
});

// ==================== POST-REGISTER TESTS ====================
describe('POST /register', () => {
  let req, res;
  beforeEach(() => {
    req = { body: { email: 'neu@uni.de', passwort: 'sicherespw', name: 'Zoe' } };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  test('Szenario 1: erfolgreiche Registrierung', async () => {
    bcrypt.hash.mockResolvedValue('fake-hash-999');
    User.findOne.mockResolvedValue(null);

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/register').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      email: 'neu@uni.de',
      name: 'Zoe',
      passwort: 'fake-hash-999'
    }));
  });

  test('Szenario 2: E-Mail existiert bereits', async () => {
    bcrypt.hash.mockResolvedValue('fake-hash-999');
    User.findOne.mockResolvedValue({ email: 'neu@uni.de' });

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/register').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "email already exists!" });
  });
});

// ==================== GET BY ID TESTS ====================
describe('GET /:id - Get One User via ID', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id: 'user-abc-123' } }; 
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  test('Szenario 1: Benutzer existiert', async () => {
    const mockUser = { _id: 'user-abc-123', email: 'id-test@uni.de', name: 'Tom' };
    User.findOne.mockResolvedValue(mockUser);

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(mockUser);
  });

  test('Szenario 2: Benutzer existiert NICHT (404)', async () => {
    User.findOne.mockResolvedValue(null);

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "User does not exist!" });
  });
});

// ==================== GET TODOS FOR ONE USER TESTS ====================
describe('GET /:id/todos - Get All Todos for One User', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id: 'user-abc-123' } }; 
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  test('Szenario 1: Benutzer hat Todos (Gülcan, Tupoka etc.)', async () => {
    // Auch hier nutzen wir deine feste Namensliste als Zuordnung für die Todos!
    const mockTodos = [
      { id: 101, todoName: 'DevOps lernen', user_id: 'user-abc-123', name: 'Anna' },
      { id: 102, todoName: 'Unit-Tests schreiben', user_id: 'user-abc-123', name: 'Ben' },
      { id: 103, todoName: 'Git-Konflikte loesen', user_id: 'user-abc-123', name: 'Gülcan' },
      { id: 104, todoName: 'Frontend anbinden', user_id: 'user-abc-123', name: 'Tupoka' },
      { id: 105, todoName: 'Projekt abgeben', user_id: 'user-abc-123', name: 'Ugur' }
    ];
    Todo.find.mockResolvedValue(mockTodos); 

    // Hier mit dem korrigierten [0]-Array Zugriff!
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id/todos').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(mockTodos);
  });

  test('Szenario 2: Benutzer hat noch keine Todos (leeres Array)', async () => {
    Todo.find.mockResolvedValue([]); 

    // Hier mit dem korrigierten [0]-Array Zugriff!
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id/todos').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([]);
  });
});


// ==================== GET SPECIFIC TODO FOR USER TESTS ====================
describe('GET /:userId/todos/:todoId - Get One Specific Todo', () => {
  let req, res;
  beforeEach(() => {
    // Wir simulieren beide URL-Parameter
    req = { params: { userId: 'user-abc-123', todoId: 'todo-999' } }; 
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  test('Szenario 1: Spezifisches Todo existiert (z.B. für Gülcan)', async () => {
    // ARRANGEMENT: Wir bauen ein passendes Todo für Gülcan
    const mockTodo = { 
      id: 'todo-999', 
      todoName: 'Git-Konflikte loesen', 
      user_id: 'user-abc-123', 
      name: 'Gülcan' 
    };
    Todo.findOne.mockResolvedValue(mockTodo); // Simuliert den Treffer in der DB

    // ACT: Pfadabgleich für '/:userId/todos/:todoId'
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path?.includes('todos/:todoId')).route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Todo muss erfolgreich gesendet worden sein
    expect(res.send).toHaveBeenCalledWith(mockTodo);
  });

  test('Szenario 2: Todo existiert nicht für diesen User (404)', async () => {
    // ARRANGEMENT: Datenbank findet unter dieser Kombination nichts
    Todo.findOne.mockResolvedValue(null);

    // ACT
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path?.includes('todos/:todoId')).route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Status 404 und Fehlermeldung prüfen
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      error: "Todo does not exist!"
    });
  });
});

// ==================== PATCH UPDATE USER TESTS ====================
describe('PATCH /:id - Update One User', () => {
  let req, res;
  beforeEach(() => {
    req = { 
      params: { id: 'user-ugur-999' },
      body: { name: 'Ugur-Neu' } // Wir aktualisieren nur den Namen
    }; 
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
    
    // Falls updateOne noch nicht gemockt ist, hängen wir es hier sicherheitshalber an
    User.updateOne = jest.fn();
  });

  test('Szenario 1: Benutzer erfolgreich aktualisieren (z.B. Ugur)', async () => {
    // ARRANGEMENT: Wir simulieren den bestehenden User vor dem Update
    const mockUser = { 
      _id: 'user-ugur-999', 
      email: 'ugur@uni.de', 
      name: 'Ugur', 
      passwort: 'pw123' 
    };
    User.findOne.mockResolvedValue(mockUser);
    User.updateOne.mockResolvedValue({ acknowledged: true }); // Simuliert erfolgreiches Speichern

    // ACT: Wir holen uns den Handler für den Pfad '/:id' unter Berücksichtigung, dass es eine PATCH-Methode ist
    // Express speichert PATCH-Routen genauso wie GET im stack
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id' && layer.route.methods.patch).route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Prüfen, ob der geänderte Name im zurückgegebenen Objekt drin ist
    expect(mockUser.name).toBe('Ugur-Neu');
    expect(User.updateOne).toHaveBeenCalledWith({ _id: 'user-ugur-999' }, mockUser);
    expect(res.send).toHaveBeenCalledWith(mockUser);
  });

  test('Szenario 2: Benutzer existiert nicht oder Fehler beim Update (404)', async () => {
    // ARRANGEMENT: findOne wirft einen Fehler aus (simuliert die catch-Bedingung)
    User.findOne.mockRejectedValue(new Error('Database error'));

    // ACT
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id' && layer.route.methods.patch).route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Status 404 und Fehlermeldung im Catch-Block prüfen
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "User does not exist!" });
  });
});

// ==================== DELETE USER TESTS ====================
describe('DELETE /:id - Delete One User', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id: 'user-to-delete-123' } }; 
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
    
    // Wir stellen sicher, dass deleteOne gemockt ist
    User.deleteOne = jest.fn();
  });

  test('Szenario 1: Benutzer erfolgreich loeschen (Status 204)', async () => {
    // ARRANGEMENT: deleteOne gibt im Erfolgsfall ein Bestätigungsobjekt zurück
    User.deleteOne.mockResolvedValue({ deletedCount: 1 });

    // ACT: Wir suchen gezielt nach der DELETE-Methode auf dem Pfad '/:id'
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id' && layer.route.methods.delete).route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Prüfen, ob der richtige Status gesendet wurde und deleteOne aufgerufen wurde
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user-to-delete-123' });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  test('Szenario 2: Fehler beim Loeschen (404)', async () => {
    // ARRANGEMENT: Die Datenbank wirft einen Fehler aus (löst den catch-Block aus)
    User.deleteOne.mockRejectedValue(new Error('Database error'));

    // ACT
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id' && layer.route.methods.delete).route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Status 404 und Fehlermeldung prüfen
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "User does not exist!" });
  });
});


