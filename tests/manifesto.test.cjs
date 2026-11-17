const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {JSDOM}=require('jsdom');
const {runHome,assertDictionaryUnchanged}=require('./home-reachability.test.cjs');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const page=()=>new JSDOM(read('public/manifesto.html'),{url:'https://example.test/manifesto.html'});

test('Manifesto renders the exact approved title and all six complete Russian paragraphs',()=>{
  const source=read('MANIFESTO.md');
  assert.equal(createHash('sha256').update(source).digest('hex'),
    '40dfc222626f3c4d572d61de6823a4cc86397513b653764c30eab305671a1995');
  const expected=source.trim().split(/\n\s*\n/).map(block=>block.replaceAll('**',''));
  const dom=page(),document=dom.window.document;
  assert.equal(document.documentElement.lang,'ru');
  assert.equal(document.querySelectorAll('main').length,1);
  assert.equal(document.querySelectorAll('h1').length,1);
  assert.equal(document.querySelectorAll('main p').length,6);
  assert.deepEqual([...document.querySelectorAll('main h1,main p')].map(node=>node.textContent),expected);
  assert.equal(document.title,expected[0]);
  assert.equal(document.querySelectorAll('script,form,details,[hidden],[data-i18n],[data-i18n-html]').length,0);
  dom.window.close();
});

test('skip and both return navigation groups are native links with a focusable main target',()=>{
  const dom=page(),document=dom.window.document;
  const links=[...document.querySelectorAll('a')];
  assert.deepEqual(links.map(a=>a.getAttribute('href')),['#main','/','/','/#about','/','/#about']);
  assert.equal(document.querySelector('#main').getAttribute('tabindex'),'-1');
  assert.equal(document.querySelector('body').firstElementChild,links[0]);
  assert.equal(document.querySelector('main').lastElementChild.tagName,'NAV');
  assert(links.every(a=>!a.hasAttribute('target')&&!a.hasAttribute('onclick')&&!a.hasAttribute('tabindex')));
  assert([...document.querySelectorAll('link[href]')].every(a=>a.getAttribute('href').startsWith('/assets/')));
  dom.window.close();
});

test('About and footer expose the same optional Russian page without changing any existing locale dictionary',()=>{
  const html=read('public/index.html'),dom=new JSDOM(html),document=dom.window.document;
  const links=[...document.querySelectorAll('a[href="/manifesto.html"]')];
  assert.equal(links.length,2);
  assert(links[0].closest('section#about'));
  assert(links[1].closest('nav.footer-nav'));
  assert(links.every(a=>a.textContent==='Манифест'&&a.lang==='ru'&&!a.hasAttribute('data-i18n')));
  assert.equal(document.querySelectorAll('#about').length,1);
  const app=runHome(read('public/assets/script.js'),html);
  assertDictionaryUnchanged(app);
  for(const lang of ['en','es','ca','ru']){
    app.language(lang);
    assert.equal(app.snapshot().lang,lang);
    assert.deepEqual(app.value('navAbout'),Array(3).fill({en:'About',es:'Nosotros',ca:'Nosaltres',ru:'О нас'}[lang]));
    assert.equal(app.requests.length,0);
  }
  dom.window.close();
});
