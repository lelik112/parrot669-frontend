const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/search.js'), 'utf8');
const start = source.indexOf('function render(items){');
const end = source.indexOf('function plusDays(', start);

function renderLinks(links) {
  assert.ok(start >= 0 && end > start, 'Search render function boundaries');
  class Element {
    constructor() { this.children = []; this.classList = {add() {}}; }
    get childElementCount() { return this.children.length; }
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
  }
  const results = new Element();
  const sandbox = {
    document: {createElement: () => new Element()}, results, renderedItems: null,
    resultState: null, window: {}, t: key => key, URL
  };
  vm.runInNewContext(source.slice(start, end) + '\nrender([{links}]);', {...sandbox, links});
  function all(node) { return [node, ...node.children.flatMap(all)]; }
  return all(results).filter(node => node.className === 'availability-link');
}

const url = 'https://www.airbnb.com/rooms/9007199254740993123';
const publicListing = {provider: 'Airbnb', url, calendarControlStatus: 'verified'};

test('guest Search renders a canonical Airbnb link without a separate listing ID', () => {
  const [link] = renderLinks([publicListing]);
  assert.equal(link?.href, url);
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
});

test('guest Search rejects noncanonical URLs and does not trust the legacy listing ID', () => {
  const invalid = [
    {...publicListing, provider: 'Other'},
    {externalId: '12', url: 'https://www.airbnb.com/rooms/12', calendarControlStatus: 'verified'},
    ...[url + '?x=1', url + '#x', url + '\n', url.replace('.com/', '.com.evil.test/'),
      url.replace('.com/', '.com:443/'), url.replace('www.', 'user@www.'),
      url.replace('/rooms/', '/x/../rooms/'), 'https://www.airbnb.com/rooms/' + '9'.repeat(65)]
      .map(value => ({...publicListing, url: value})),
  ];
  assert.deepEqual(renderLinks(invalid), []);
});
