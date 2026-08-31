const test = require('node:test');
const assert = require('node:assert/strict');

const { getPort } = require('../server');

test('verwendet PORT aus der Umgebung für Cloud Run', () => {
  const prev = process.env.PORT;
  process.env.PORT = '9090';

  try {
    assert.equal(getPort(), 9090);
  } finally {
    if (prev === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = prev;
    }
  }
});

test('fällt auf Standard 8080 zurück', () => {
  const prev = process.env.PORT;
  delete process.env.PORT;

  try {
    assert.equal(getPort(), 8080);
  } finally {
    if (prev === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = prev;
    }
  }
});
