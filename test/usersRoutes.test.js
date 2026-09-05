// ------ Isolierter Unit-Test des GET-Endpunkts mit simulierter Datenbank-Antwort. ------

// 1. Importiere den Router aus der übergeordneten Datei
const router = require('../usersRoutes'); 

// 2. Wir mocken (simulieren) das User-Model, damit keine echte Datenbank benötigt wird
jest.mock('../models/users', () => ({
  find: jest.fn()
}));

// Wir importieren das gemockte Model, um die Testdaten einzuspeisen
const User = require('../models/users'); 

describe('GET / - Get All Users', () => {
  test('sollte alle Benutzer erfolgreich zurückgeben', async () => {
    // ARRANGEMENT (Vorbereitung): Das soll unsere Fake-Datenbank zurückgeben
    const mockUsers = [
      { id: 1, name: 'Anna' },
      { id: 2, name: 'Ben' }
    ];
    User.find.mockResolvedValue(mockUsers); 

    // Wir erstellen Fake-Objekte für Express (req und res)
    const req = {};
    const res = {
      send: jest.fn() // Eine Jest-Spionage-Funktion, die aufpasst, was gesendet wird
    };

    // ACT (Ausführung): Wir suchen uns die Funktion aus dem Router und führen sie aus
    const routeHandler = router.stack.find(layer => layer.route && layer.route.path === '/').route.stack[0].handle;
    await routeHandler(req, res);

    // ASSERT (Überprüfung): Hat die Funktion die Daten an res.send() übergeben?
    expect(res.send).toHaveBeenCalledWith(mockUsers);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});