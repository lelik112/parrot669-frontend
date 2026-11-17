const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/team.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/assets/team.css'),'utf8');
const document=new JSDOM(html).window.document;

test('Team source contains the owner-approved local nine-person roster and honest identity split',()=>{
  const cards=[...document.querySelectorAll('.team-card')];
  assert.equal(cards.length,9);
  assert.equal(cards.filter(card=>card.dataset.kind==='human').length,1);
  assert.equal(cards.filter(card=>card.dataset.kind==='ai').length,8);
  assert.deepEqual(cards.map(card=>card.dataset.member),['alexey','alex','mark','denis','igor','boris','nikita','codex','masha']);
  assert.equal(document.querySelector('[data-member=alexey]').textContent.includes('ЧЕЛОВЕК'),true);
  assert.equal(document.querySelectorAll('[data-kind=ai] .team-person-kind').length,8);
});

test('Team cards expose seven exact verified GitHub profiles and two true no-link cards',()=>{
  const links=[...document.querySelectorAll('.team-card .team-github')].map(link=>link.href);
  assert.deepEqual(links,[
    'https://github.com/lelik112',
    'https://github.com/parrot669-mark',
    'https://github.com/parrot669-denis',
    'https://github.com/parrot669-igor',
    'https://github.com/parrot669-boris',
    'https://github.com/parrot669-nikita',
    'https://github.com/parrot669-codex'
  ]);
  assert.equal(document.querySelector('[data-member=alex] .team-github'),null);
  assert.equal(document.querySelector('[data-member=masha] .team-github'),null);
});

test('Team public source contains no operational fields and no external portrait hotlinks',()=>{
  assert.doesNotMatch(html,/AgentMail|inbox|Wake ID|model setting|reasoning|credential|permission|@agentmail|chatgpt\.com/i);
  const portraits=[...document.querySelectorAll('.team-portrait')].map(image=>image.getAttribute('src'));
  assert.equal(portraits.length,9);
  const approved={
    '/assets/team/alexey-crop.png':'4f4292747379b9f58651d0d40c741613af5873cb6f64bba2a1fbab11d0591926',
    '/assets/team/alex.png':'31c5153563836694eb8d31001d294a8a18f0a62807e7f892b8befa88645678c7',
    '/assets/team/masha-designer.png':'9e5a0b8b463681af71c7a730b96b2793a7615182d9b32ed076f281f53f2cc1c1',
    '/assets/team/mark.png':'4fe79752286118b3888af1304a933cb9c2775b686985e96aa615187185923e12',
    '/assets/team/codex.png':'d55067800dd604f7feffb7cc3052be8ed2fb0b3fb0b397ee4fd9089d76f33fd2',
    '/assets/team/igor.png':'f432927d7bb8eee283222045bad5f4ce422f1dc207adc78fdd7299f00db70935'
  };
  const {createHash}=require('node:crypto');
  assert.equal(portraits.filter(source=>Object.hasOwn(approved,source)).length,6);
  const igor=document.querySelector('[data-member=igor] img');
  assert.equal(igor.width,1254); assert.equal(igor.height,1254);
  const igorPng=fs.readFileSync(path.join(root,'public/assets/team/igor.png'));
  assert.equal(igorPng.readUInt32BE(16),1254); assert.equal(igorPng.readUInt32BE(20),1254);
  for(const source of portraits){
    const file=path.join(root,'public',source);
    if(Object.hasOwn(approved,source)){
      assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),approved[source]);
    }else{
      assert.match(source,/^\/assets\/team\/[a-z-]+\.(?:webp|png|jpg)$/);
      assert.equal(fs.existsSync(file),false);
    }
  }
  assert.match(fs.readFileSync(path.join(root,'tests/fixtures/team-portrait-synthetic.svg'),'utf8'),/TEST ONLY · SYNTHETIC/);
});

test('Team navigation keeps Product on root and Team as a secondary route',()=>{
  assert.equal(document.querySelector('.team-brand').getAttribute('href'),'/');
  assert.equal(document.querySelector('.team-footer nav a:first-child').getAttribute('href'),'/');
  assert.equal(document.querySelectorAll('a[href="/team.html"]').length,2);
  assert.equal(document.querySelectorAll('[aria-current=page]').length,2);
});

test('Team has native landmarks, a focusable skip target and no Home controller',()=>{
  assert.equal(document.documentElement.lang,'ru');
  for(const selector of ['header','main','footer','h1'])assert.equal(document.querySelectorAll(selector).length,1);
  assert.equal(document.querySelector('.team-skip-link').getAttribute('href'),'#team-members');
  assert.equal(document.querySelector('#team-members').getAttribute('tabindex'),'-1');
  assert.equal(document.querySelectorAll('script,form,button,input').length,0);
  assert.equal(document.querySelector('.team-footer [aria-label="Язык страницы: русский"]').textContent,'RU');
});

test('saved Home locale labels the RU Team destination and survives the page roundtrip',()=>{
  const {runHome}=require('./home-reachability.test.cjs');
  const home=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  const script=fs.readFileSync(path.join(root,'public/assets/script.js'),'utf8');
  for(const [locale,label] of Object.entries({en:'Team',es:'Equipo',ca:'Equip',ru:'Команда'})){
    const before=runHome(script,home,'zz',locale);
    assert.deepEqual(before.value('navTeam'),[label]);
    const team=new JSDOM(html,{url:'https://example.test/team.html'});
    team.window.localStorage.setItem('parrot669-language',locale);
    assert.equal(team.window.document.documentElement.lang,'ru');
    assert.equal(team.window.document.querySelectorAll('script').length,0);
    assert.equal(team.window.localStorage.getItem('parrot669-language'),locale);
    const after=runHome(script,home,'zz',team.window.localStorage.getItem('parrot669-language'));
    assert.equal(after.snapshot().lang,locale);
    assert.equal(before.requests.length+after.requests.length,0);
    team.window.close();
  }
});

test('Team styling stays page-scoped and preserves natural compact wrapping',()=>{
  assert.match(css,/PM-092 local-only accepted Team composition/);
  assert.match(css,/\.team-page/);
  assert.doesNotMatch(css,/^\s*(body|html|:root)\s*\{/m);
  assert.match(css,/\.team-bio[\s\S]*overflow-wrap:break-word[\s\S]*word-break:normal/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(max-width:340px\)/);
});


test('Codex local card uses only approved public role/copy and accessible exact social links',()=>{
  const card=document.querySelector('[data-member=codex]');
  assert.equal(card.querySelector('h3').textContent,'Кодекс');
  assert.equal(card.querySelector('.team-role').textContent,'Тимлид');
  assert.equal(card.querySelector('.team-bio').textContent,'Разработка и технические исследования.');
  const links=[...card.querySelectorAll('a')];
  assert.deepEqual(links.map(a=>[a.href,a.getAttribute('aria-label')]),[
    ['https://github.com/parrot669-codex','GitHub Кодекс'],
    ['https://www.instagram.com/codex.parrot669/','Instagram Кодекс']
  ]);
  for(const link of links)assert.equal(link.rel,'noreferrer');
  assert.equal(document.querySelector('.team-stats dt').textContent,'9');
  assert.deepEqual([...document.querySelectorAll('[data-portrait-status=pending-input]')].map(i=>i.closest('[data-member]').dataset.member),[]);
  assert.equal(document.querySelectorAll('.team-footer-inner').length,1);
});


test('five square portraits share an explicit format across normal and wide cards',()=>{
  assert.deepEqual([...document.querySelectorAll('.team-square-portrait')].map(c=>c.dataset.member),['alex','mark','igor','codex','masha']);
  assert.match(css,/\.team-square-portrait \.team-portrait-frame\{[^}]*min-height:0;[^}]*height:auto;aspect-ratio:1/);
  assert.match(css,/\.team-square-portrait \.team-portrait\{[^}]*width:100%;height:100%;object-fit:cover;object-position:center/);
  assert.doesNotMatch(css,/aspect-ratio:640\/520/);
  assert.match(css,/\.team-card-wide\.team-square-portrait\{min-height:0\}/);
});

test('owner public crop is vertical and shows the entire crop without publishing unused originals',()=>{
  const {createHash}=require('node:crypto');
  for(const unused of ['alexey-full.jpg','alexey.jpg','masha.jpg'])
    assert.equal(fs.existsSync(path.join(root,'public/assets/team',unused)),false);
  const image=document.querySelector('[data-member=alexey] img');
  assert.equal(image.getAttribute('src'),'/assets/team/alexey-crop.png');
  assert.equal(image.width,819); assert.equal(image.height,1100);
  const png=fs.readFileSync(path.join(root,'public/assets/team/alexey-crop.png'));
  assert.equal(png.readUInt32BE(16),819); assert.equal(png.readUInt32BE(20),1100);
  assert.match(css,/\[data-member="alexey"\] \.team-portrait\{object-fit:contain;object-position:center\}/);
});


test('portrait equality rejects the old square-but-unequal boxes in either dimension',()=>{
  const {validateEqualPortraitSizes}=require('./team-portrait-geometry.cjs');
  const cards=['alex','mark','codex','masha'].map(member=>({member,frame:{width:374,height:374},image:{width:372,height:372}}));
  assert.equal(validateEqualPortraitSizes(cards).maximumDelta,0);
  for(const box of ['frame','image']){
    for(const dimension of ['width','height']){
      const unequal=structuredClone(cards);
      unequal[0][box][dimension]+=2;
      assert.throws(()=>validateEqualPortraitSizes(unequal),new RegExp(`equal ${box} ${dimension}`));
    }
  }
  const previousDesktop=structuredClone(cards);
  for(const card of previousDesktop.slice(0,2)){
    card.frame={width:638,height:638};card.image={width:638,height:638};
  }
  assert.throws(()=>validateEqualPortraitSizes(previousDesktop),/equal frame width/);
  const rounded=structuredClone(cards);rounded[0].image.width+=1/64;
  assert.equal(validateEqualPortraitSizes(rounded).maximumDelta,1/64);
});
