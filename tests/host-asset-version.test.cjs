const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const hostHtml = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'host.html'),
  'utf8',
);

test('host page versions the provider-contract and verification controller assets', () => {
  assert.match(
    hostHtml,
    /<script src="\/assets\/calendar-verification\.js\?v=20261002-camelcase-status"><\/script>/,
  );
  assert.match(
    hostHtml,
    /<script src="\/assets\/host\.js\?v=20261002-camelcase-status"><\/script>/,
  );
});
