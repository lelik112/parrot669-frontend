const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const hostHtml = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'host.html'),
  'utf8',
);

test('host page loads one module entrypoint with address and calendar dependencies', () => {
  assert.match(hostHtml, /type="module" src="\/assets\/entry\.js" data-parrot-page="host"/);
  const entry=fs.readFileSync(path.join(__dirname,'../public/assets/entry.js'),'utf8');
  assert.match(entry,/host: \["messaging-common.js", "host-address.js", "calendar-verification.js", "host.js"\]/);
});
