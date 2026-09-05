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

jest.mock('bcrypt', () => ({ 
  compare: jest.fn(),
  hash: jest.fn() 
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const User = require('../models/users'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==================== GET-TESTS ====================
describe('GET / - Get All Users', () => {
  test('sollte alle Benutzer erfolgreich zurückgeben', async () => {
    const mockUsers = [{ id: 1, name: 'Anna' }, { id: 2, name: 'Ben' }];
    User.find.mockResolvedValue(mockUsers); 

    const req = {};
    const res = { send: jest.fn() };

    // Hier mit [0] korrigiert!
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

    // Hier mit [0] korrigiert!
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

    // Hier mit [0] korrigiert!
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/login').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid email/password" });
  });

  test('Szenario 3: E-Mail nicht gefunden', async () => {
    User.findOne.mockResolvedValue(null);

    // Hier mit [0] korrigiert!
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

    // Hier mit [0] korrigiert!
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

    // Hier mit [0] korrigiert!
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
    // Wir simulieren req.params.id statt req.body
    req = { params: { id: 'user-abc-123' } }; 
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  test('Szenario 1: Benutzer existiert', async () => {
    // ARRANGEMENT: Wir gaukeln vor, dass der User in der Datenbank existiert
    const mockUser = { _id: 'user-abc-123', email: 'id-test@uni.de', name: 'Tom' };
    User.findOne.mockResolvedValue(mockUser);

    // ACT: Wir holen uns den Handler für den Pfad '/:id'
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id').route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Wurde der User mit Erfolg zurückgegeben?
    expect(res.send).toHaveBeenCalledWith(mockUser);
  });

  test('Szenario 2: Benutzer existiert NICHT (404)', async () => {
    // ARRANGEMENT: findOne gibt null zurück, wenn nichts gefunden wird
    User.findOne.mockResolvedValue(null);

    // ACT
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/:id').route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT: Prüfen, ob Status 404 und die Fehlermeldung gesendet wurden
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      error: "User does not exist!"
    });
  });
});
