const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {profileCopy}=require('../public/assets/profile-copy.js');
const {production,auditGraph,runHome,assertDictionaryUnchanged}=require('./home-reachability.test.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('one own editor entry is separate from the unchanged public route and keeps Home controller exclusive',()=>{
  const graph=auditGraph(production());
  assert.equal(graph.pages.length,9);
  assert(graph.reach['public/my-profile.html'].includes('public/assets/profile-editor.js'));
  assert(graph.reach['public/my-profile.html'].includes('public/assets/shared/session.js'));
  assert(!graph.reach['public/my-profile.html'].includes('public/assets/public-profile.js'));
  assert(!graph.reach['public/profile.html'].includes('public/assets/profile-editor.js'));
  assertDictionaryUnchanged(runHome(read('public/assets/script.js'),read('public/index.html')));
});

test('all accepted copy keys remain complete, localized and free of mismatched placeholders',()=>{
  assert.deepEqual(Object.keys(profileCopy),['ru','en','es','ca']);
  const keys=Object.keys(profileCopy.ru).sort();assert.equal(keys.length,116);
  for(const copy of Object.values(profileCopy)){
    assert.deepEqual(Object.keys(copy).sort(),keys);
    assert(Object.values(copy).every(value=>typeof value==='string'&&value.trim()));
    for(const key of keys)assert.deepEqual(copy[key].match(/\{[^}]+\}/g)||[],profileCopy.ru[key].match(/\{[^}]+\}/g)||[]);
  }
  const html=read('public/my-profile.html');
  for(const [,key] of html.matchAll(/data-profile-copy="([^"]+)"/g))assert(keys.includes(key),key);
  for(const copy of Object.values(profileCopy)){
    assert(copy['visibility.hidden.body']);assert(copy['visibility.listings.help']);assert(copy['form.check.help']);
    assert(copy['visibility.review.private']);assert(copy['preview.dirty']);
  }
});

test('private own form begins hidden and empty, with explicit labels/errors and no fictional ID or None claim',()=>{
  const html=read('public/my-profile.html');
  assert.match(html,/<div id="editor-private" hidden>/);
  assert.match(html,/<main class="editor-shell">/);
  assert.match(html,/<form id="profile-editor-form" novalidate>/);
  assert.match(html,/id="editor-name" name="displayName" required maxlength="120" aria-describedby="name-help name-error"/);
  assert.match(html,/id="editor-about" name="about" maxlength="500" rows="4" aria-describedby="about-help about-error"/);
  assert.doesNotMatch(html,/PRT-669-A7|anna@example|anna\.demo|REVIEW|S00|instagram\.none|<img|type="file"/);
  assert.match(html,/<span id="editor-parrot-id"><\/span>/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  const referenced=[...html.matchAll(/(?:for|aria-controls|aria-labelledby)="([^"]+)"/g)].flatMap(m=>m[1].split(' '));
  for(const id of referenced)assert(ids.includes(id),id);
  assert([...html.matchAll(/(?:src|href)="([^"]+)"/g)].every(([,href])=>href.startsWith('/')));
});

test('new styles are scoped, do not conceal text, load fonts, or impose a narrow-page minimum width',()=>{
  const css=read('public/assets/my-profile.css');
  const selectors=css.split('\n').map(s=>s.trim()).filter(s=>s.includes('{')&&!s.startsWith('@media'));
  assert(selectors.every(s=>s.startsWith('.my-profile-page')),selectors.join('\n'));
  assert.doesNotMatch(css,/@import|url\(|line-clamp|text-overflow:ellipsis/);
  assert.doesNotMatch(css.slice(0,css.indexOf('}')),/min-width:\s*[1-9]/);
  assert.match(css,/min-height:48px/);assert.match(css,/grid-template-columns:1fr/);
});
