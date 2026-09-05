// ==================== IMPORTS & MOCKS ====================
const router = require('../usersRoutes'); 

// Alle Mocks müssen ganz nach oben
jest.mock('../models/users', () => ({ find: jest.fn(), findOne: jest.fn() }));
jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const User = require('../models/users'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==================== GET-TESTS ====================
describe('GET / - Get All Users', () => {
  test('sollte alle Benutzer erfolgreich zurückgeben', async () => {
    const mockUsers = [{ id: 1, name: 'Anna' }, { id: 2, name: 'Ben' },
        { id: 3, name: 'Gülcan' }, { id: 4, name: 'Tupoka' }, { id: 5, name: 'Ugur' }];
    User.find.mockResolvedValue(mockUsers); 

    const req = {};
    const res = { send: jest.fn() };

    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/').route.stack[0].handle;
    await routeHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(mockUsers);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});

// ==================== POST-TESTS ====================
describe('POST /login', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: 'test@uni.de', passwort: 'geheim123' } };
    res = {
      status: jest.fn().mockReturnThis(), // .mockReturnThis() erlaubt res.status().send()
      send: jest.fn()
    };
    jest.clearAllMocks(); // Setzt alle Spione für jeden Test zurück
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
