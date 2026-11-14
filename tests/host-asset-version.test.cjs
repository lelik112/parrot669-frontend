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
  assert.equal(entry, 'import "./entry.js";\nimport "./profile-navigation.js";\nimport "./messaging-common.js";\nimport "./host-address.js";\nimport "./calendar-verification.js";\nimport "./host.js";\n');
});

test('workspace precedes closed add-property management and profile without an extra script',()=>{
  assert.ok(hostHtml.indexOf('id="host-properties"')<hostHtml.indexOf('id="property-form"'));
  assert.ok(hostHtml.indexOf('id="property-panel"')<hostHtml.indexOf('id="host-profile"'));
  assert.match(hostHtml,/<details class="host-workspace-disclosure host-add-property" id="host-add-property">/);
  assert.equal((hostHtml.match(/<script /g)||[]).length,1);
});
