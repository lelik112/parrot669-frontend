const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const hostHtml = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'host.html'),
  'utf8',
);

test('host page loads one module entrypoint with address and calendar dependencies', () => {
  assert.match(hostHtml, /type="module" src="\/assets\/entry-host\.js"/);
  const entry=fs.readFileSync(path.join(__dirname,'../public/assets/entry-host.js'),'utf8');
  assert.equal(entry, 'import "./entry.js";\nimport "./messaging-common.js";\nimport "./host-address.js";\nimport "./calendar-verification.js";\nimport "./host.js";\n');
});
