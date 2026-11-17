const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const file = name => fs.readFileSync(path.join(__dirname,'../public',name),'utf8');
const ids = ['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'];
const [property, conversation, otherConversation] = ids;
const profile = 'P669-BBBB-BBBB-BBBB-BBBB';
const user = {accountId:'guest-account',username:'guest',parrotId:profile};
const detail = (id=conversation, extra={}) => ({id,propertyId:property,propertyTitle:id===conversation?'Apartment':'Room',
  hostProfileId:'P669-AAAA-AAAA-AAAA-AAAA',guestProfileId:profile,
  otherDisplayName:'Host',lastSequence:1,readThroughSequence:0,unreadCount:1,lastMessagePreview:'Hello',
  updatedAt:'2026-09-23T10:00:00Z',canReply:true,blockedByMe:false,blockedByOther:false,...extra});
const message = (sequence=1, extra={}) => ({id:`55555555-5555-4555-8555-${String(sequence).padStart(12,'0')}`,sequence,
  senderProfileId:'P669-AAAA-AAAA-AAAA-AAAA',clientMessageId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  body:`Message ${sequence}`,from:null,to:null,createdAt:'2026-09-23T10:00:00Z',...extra});
const flush = async () => { for(let i=0;i<8;i++) await new Promise(resolve=>setImmediate(resolve)); };
const deferred = () => { let resolve; const promise=new Promise(r=>resolve=r); return {promise,resolve}; };
const response = (data,status=200) => new Response(JSON.stringify(data),{status});

// Actual producer variants, not a truthy acknowledgement stub.
const sendAck = (payload,firstSend=false,sequence=1) => {
  const value={id:`55555555-5555-4555-8555-${String(sequence).padStart(12,'0')}`,sequence,
    senderProfileId:profile,clientMessageId:payload.clientMessageId,body:payload.body,
    from:payload.from??null,to:payload.to??null,createdAt:'2026-10-18T12:00:00.123456Z'};
  return firstSend?{conversationId:conversation,message:value}:value;
};
const invalidAckCases={
  'truthy invalid identifier type':(ack,first)=>first?{...ack,conversationId:123}:{...ack,id:123},
  'truthy invalid identifier value':(ack,first)=>first?{...ack,conversationId:'not-a-uuid'}:{...ack,id:'not-a-uuid'},
  'identifier array is not a string':(ack,first)=>first?{...ack,conversationId:[conversation]}:{...ack,id:[ack.id]},
  'wrong ACK variant':(ack,first)=>first?ack.message:{conversationId:conversation,message:ack},
  'missing MessageView fields':(ack,first)=>first?{conversationId:conversation,message:{id:ack.message.id}}:{id:ack.id},
  'invalid nested message id':(ack,first)=>first?{...ack,message:{...ack.message,id:123}}:{...ack,id:123},
  'clientMessageId wrong type':(ack,first)=>{const value=first?ack.message:ack;const bad={...value,clientMessageId:[value.clientMessageId]};return first?{...ack,message:bad}:bad;},
  'different clientMessageId':(ack,first)=>{const bad={...(first?ack.message:ack),clientMessageId:'99999999-9999-4999-8999-999999999999'};return first?{...ack,message:bad}:bad;},
  'legacy UUID sender':(ack,first)=>{const bad={...(first?ack.message:ack),senderProfileId:'99999999-9999-4999-8999-999999999999'};return first?{...ack,message:bad}:bad;},
  'different canonical sender':(ack,first)=>{const bad={...(first?ack.message:ack),senderProfileId:'P669-CCCC-CCCC-CCCC-CCCC'};return first?{...ack,message:bad}:bad;},
  'lowercase sender':(ack,first)=>{const bad={...(first?ack.message:ack),senderProfileId:profile.toLowerCase()};return first?{...ack,message:bad}:bad;},
  'whitespace sender':(ack,first)=>{const bad={...(first?ack.message:ack),senderProfileId:profile+' '};return first?{...ack,message:bad}:bad;},
  'invalid sender type':(ack,first)=>{const bad={...(first?ack.message:ack),senderProfileId:[profile]};return first?{...ack,message:bad}:bad;},
  'different body':(ack,first)=>{const bad={...(first?ack.message:ack),body:'Not this submitted message'};return first?{...ack,message:bad}:bad;},
  'non-integer sequence':(ack,first)=>{const bad={...(first?ack.message:ack),sequence:'1'};return first?{...ack,message:bad}:bad;},
  'non-positive sequence':(ack,first)=>{const bad={...(first?ack.message:ack),sequence:0};return first?{...ack,message:bad}:bad;},
  'fractional sequence':(ack,first)=>{const bad={...(first?ack.message:ack),sequence:1.5};return first?{...ack,message:bad}:bad;},
  'sequence outside producer Int':(ack,first)=>{const bad={...(first?ack.message:ack),sequence:2147483648};return first?{...ack,message:bad}:bad;},
  'unusable timestamp':(ack,first)=>{const bad={...(first?ack.message:ack),createdAt:'not-a-date'};return first?{...ack,message:bad}:bad;},
  'missing optional date fields':(ack,first)=>{const bad={...(first?ack.message:ack)};delete bad.from;delete bad.to;return first?{...ack,message:bad}:bad;},
  'different dates':(ack,first)=>{const bad={...(first?ack.message:ack),from:'2027-01-01',to:'2027-01-03'};return first?{...ack,message:bad}:bad;}
};

for(const firstSend of [true,false]) for(const [name,invalid] of Object.entries(invalidAckCases))
test(`PM138 R2-D: ${firstSend?'first-send':'reply'} ${name} keeps draft and manual-retry key`,async t=>{
  const posts=[];
  const h=await harness(t,{url:firstSend?`/messages.html?property=${property}`:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations'&&r.method==='GET')return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.method==='POST'){
      posts.push(r);
      const valid=sendAck(r.body,firstSend);
      return posts.length===1?invalid(valid,firstSend):valid;
    }
    if(r.path.endsWith('/messages'))return {items:[],nextAfterSequence:null};
  }});
  const form=h.$('msg-compose');h.input(form.elements.body,'Synthetic unconfirmed ACK');
  h.submit(form);await flush();assert.equal(posts.length,1);
  const key=`parrot669-draft:${user.accountId}:${firstSend?'property:'+property:conversation}`;
  const saved=JSON.parse(h.w.ParrotCore.storage.session.getItem(key));
  assert.ok(saved?.pending,'uncertain pending must remain');
  assert.deepEqual(saved.pending.payload,posts[0].body);
  assert.equal(saved.pending.endpoint,posts[0].path.replace('/api/messaging',''));
  assert.equal(saved.body,'Synthetic unconfirmed ACK');assert.equal(form.elements.body.value,saved.body);
  assert.equal(form.elements.body.disabled,true);assert.equal(new URL(h.w.location.href).searchParams.has('property'),firstSend);
  await flush();assert.equal(posts.length,1,'no automatic resend');
  h.submit(form);await flush();assert.equal(posts.length,2);
  assert.equal(posts[1].path,posts[0].path);assert.deepEqual(posts[1].body,posts[0].body);
  assert.equal(form.elements.body.value,'');assert.equal(form.elements.body.disabled,false);
});

for(const firstSend of [true,false]) test(`PM138 R2-D: valid ${firstSend?'ConversationStarted':'MessageView'} accepts dates, UUID case and extra fields`,async t=>{
  const h=await harness(t,{url:firstSend?`/messages.html?property=${property}`:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations'&&r.method==='GET')return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.method==='POST'){
      const ack=sendAck(r.body,firstSend,2147483647),item=firstSend?ack.message:ack;
      item.id=item.id.toUpperCase();item.clientMessageId=item.clientMessageId.toUpperCase();item.senderProfileId=item.senderProfileId.toUpperCase();
      item.createdAt='2026-10-18T14:00:00+02:00';item.futureField='ignored';
      return ack;
    }
    if(r.path.endsWith('/messages'))return {items:[],nextAfterSequence:null};
  }});
  const form=h.$('msg-compose');h.input(form.elements.body,'Valid dated acknowledgement');
  h.input(form.elements.from,'2027-01-01');h.input(form.elements.to,'2027-01-03');
  h.submit(form);await flush();assert.equal(form.elements.body.value,'');assert.equal(form.elements.body.disabled,false);
  assert.equal(h.calls.filter(r=>r.method==='POST').length,1);
});

test('PM138 R2-D: shared browser fixture emits producer ACK variants and idempotent message history',async()=>{
  const fixture=require('./e2e/auth-messaging-fixture.cjs').createAuthMessagingFixture();
  let handle;
  await fixture.install({route:async(pattern,fn)=>{if(pattern==='**/api/**')handle=fn;}},'a');
  const call=(path,body)=>handle({request:()=>({url:()=>`https://parrot669.com${path}`,method:()=> 'POST',postDataJSON:()=>body}),fulfill:value=>value});
  try {
    await call('/api/host/auth/login',{login:fixture.identities.a.username,password:'fixture-only-pass'});
    const payload={propertyId:fixture.ids.property,clientMessageId:'12345678-1234-4234-8234-123456789abc',body:'Start fixture'};
    const start=await call('/api/messaging/conversations',payload),repeat=await call('/api/messaging/conversations',payload);
    assert.deepEqual(Object.keys(start.json).sort(),['conversationId','message']);assert.equal(start.json.conversationId,fixture.ids.conversation);
    assert.deepEqual(start.json,repeat.json);assert.equal(fixture.snapshot().messages.length,1);
    const replyPayload={clientMessageId:'23456789-2345-4345-8345-23456789abcd',body:'Reply fixture'};
    const reply=await call(`/api/messaging/conversations/${fixture.ids.conversation}/messages`,replyPayload);
    for(const value of [start.json.message,reply.json]) {
      assert.deepEqual(Object.keys(value).sort(),['body','clientMessageId','createdAt','from','id','senderProfileId','sequence','to']);
      assert.match(value.id,/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i);
      assert.notEqual(value.id,value.clientMessageId);assert.equal(value.senderProfileId,fixture.ids.profileA);
    }
    assert.equal(reply.json.clientMessageId,replyPayload.clientMessageId);
    const conflict=await call(`/api/messaging/conversations/${fixture.ids.conversation}/messages`,{...replyPayload,body:'Different'});
    assert.equal(conflict.status,409);assert.equal(fixture.snapshot().messages.length,2);
  } finally {fixture.cleanup();}
});

for(const firstSend of [true,false]) for(const outcome of ['malformed200','unexpected204','invalidDTO','network','timeout','server500','http408','malformed400'])
test(`PM138 R2: ${firstSend?'first-send':'reply'} ${outcome} retains exact pending payload for manual retry`,async t=>{
  const posts=[];
  const h=await harness(t,{url:firstSend?`/messages.html?property=${property}`:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations'&&r.method==='GET')return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.method==='POST'&&(r.path==='/api/messaging/conversations'||r.path.endsWith('/messages'))) {
      posts.push(r);
      if(posts.length===1) {
        if(outcome==='malformed200')return new Response('{broken',{status:200});
        if(outcome==='unexpected204')return new Response(null,{status:204});
        if(outcome==='invalidDTO')return {};
        if(outcome==='network')throw new TypeError('Synthetic lost response');
        if(outcome==='timeout')return new Promise(()=>{});
        if(outcome==='http408')return response({code:'REQUEST_TIMEOUT',error:'Synthetic intermediary timeout'},408);
        if(outcome==='malformed400')return new Response('broken error envelope',{status:400});
        return response({error:'Synthetic server failure'},500);
      }
      return sendAck(r.body,firstSend);
    }
    if(r.path.endsWith('/messages'))return {items:[],nextAfterSequence:null};
  }});
  if(outcome==='timeout') {
    const api=h.w.ParrotMessaging.api;
    h.w.ParrotMessaging.api=(path,options={})=>api(path,{...options,timeoutMs:options.method==='POST'?5:15000});
  }
  const form=h.$('msg-compose');h.input(form.elements.body,'Synthetic retry body');
  h.submit(form);if(outcome==='timeout')await new Promise(resolve=>setTimeout(resolve,20));
  await flush();assert.equal(posts.length,1);
  const key=`parrot669-draft:${user.accountId}:${firstSend?'property:'+property:conversation}`;
  const saved=JSON.parse(h.w.ParrotCore.storage.session.getItem(key));
  assert.deepEqual(saved.pending.payload,posts[0].body);assert.equal(saved.pending.endpoint,posts[0].path.replace('/api/messaging',''));
  assert.equal(form.elements.body.disabled,true);await flush();assert.equal(posts.length,1,'no automatic resend');
  h.submit(form);await flush();assert.equal(posts.length,2);
  assert.equal(posts[1].path,posts[0].path);assert.deepEqual(posts[1].body,posts[0].body);
  const after=JSON.parse(h.w.ParrotCore.storage.session.getItem(key));
  assert.ok(after===null||after.pending===null&&after.body==='');
});

test('PM138 R2: definitive HTTP400 rejects pending and permits a new corrected send key',async t=>{
  const posts=[];
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.path.endsWith('/messages')&&r.method==='POST'){posts.push(r.body);return response({code:'INVALID_REQUEST',error:'Synthetic rejection'},400);}
    if(r.path.endsWith('/messages'))return {items:[],nextAfterSequence:null};
  }});
  const form=h.$('msg-compose');h.input(form.elements.body,'Rejected body');h.submit(form);await flush();
  assert.equal(JSON.parse(h.w.ParrotCore.storage.session.getItem(`parrot669-draft:${user.accountId}:${conversation}`)).pending,null);
  h.input(form.elements.body,'Corrected body');h.submit(form);await flush();
  assert.notEqual(posts[0].clientMessageId,posts[1].clientMessageId);
});

for(const firstSend of [true,false]) test(`PM138 R2: ${firstSend?'first-send':'reply'} committed malformed response reconciles by original key without another POST`,async t=>{
  let sent=null;
  const h=await harness(t,{url:firstSend?`/messages.html?property=${property}`:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations'&&r.method==='GET')return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/for-property/${property}`)return sent?detail():null;
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.method==='POST'){assert.equal(sent,null);sent=r.body;return new Response('{broken',{status:200});}
    if(r.path.endsWith('/messages'))return {items:sent?[message(1,{...sent,senderProfileId:profile})]:[],nextAfterSequence:null};
  }});
  const form=h.$('msg-compose');h.input(form.elements.body,'Committed synthetic message');h.submit(form);await flush();
  assert.equal(form.elements.body.disabled,true);
  // Re-open from current URL, like Back/Forward/restore; the server history proves the commit.
  h.w.dispatchEvent(new h.w.PopStateEvent('popstate'));await flush();
  assert.equal(form.elements.body.value,'');assert.equal(form.elements.body.disabled,false);
  assert.equal(h.calls.filter(r=>r.method==='POST').length,1);
  assert.match(h.$('msg-history').textContent,/Committed synthetic message/);
});

const navigationHandler=request=>{
  if(request.path==='/api/messaging/conversations')return {items:[detail(),detail(otherConversation)],nextCursor:null};
  if(request.path===`/api/messaging/conversations/${conversation}`)return detail();
  if(request.path===`/api/messaging/conversations/${otherConversation}`)return detail(otherConversation);
  if(request.path.endsWith('/messages'))return {items:[],nextAfterSequence:null};
  if(request.path==='/api/host/auth/logout')return new Response(null,{status:204});
};

test('PM140: unchanged polling preserves keyed inbox, history, composer, caret, scroll and live regions',async t=>{
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations') return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`) return detail();
    if(r.path.endsWith('/messages')) return {items:[message()],nextAfterSequence:null};
  }});
  const list=h.$('msg-list'),log=h.$('msg-history'),row=list.firstElementChild,bubble=log.firstElementChild;
  const input=h.$('msg-compose').elements.body;
  h.input(input,'Unsent text and selection');input.focus();input.setSelectionRange(3,9);
  Object.defineProperty(log,'scrollHeight',{get:()=>1000});
  Object.defineProperty(log,'clientHeight',{get:()=>200});log.scrollTop=250;
  const records=[];
  const observer=new h.w.MutationObserver(changes=>records.push(...changes));
  for(const target of [list,log,h.$('msg-status'),h.$('msg-inbox-status'),h.$('msg-thread-notice')])
    observer.observe(target,{childList:true,characterData:true,subtree:true});
  const historyLength=h.w.history.length;
  for(let i=0;i<3;i++){h.intervals[1]();await flush();}
  observer.disconnect();
  assert.equal(list.firstElementChild,row);assert.equal(log.firstElementChild,bubble);
  assert.equal(records.length,0,'unchanged private content and live regions must be mutation-free');
  assert.equal(h.$('msg-compose').elements.body,input);assert.equal(input.value,'Unsent text and selection');
  assert.equal(h.w.document.activeElement,input);assert.equal(input.selectionStart,3);assert.equal(input.selectionEnd,9);
  assert.equal(log.scrollTop,250);assert.equal(h.w.history.length,historyLength);
  assert.equal(h.calls.some(r=>r.method!=='GET'),false,'polling an unfocused history sends no commands');
});

test('PM140: incoming append retains old bubbles and composer; keyed reorder retains row focus and clears stale unread label',async t=>{
  let incoming=false;
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations')return {items:incoming?
      [detail(otherConversation,{updatedAt:'2026-09-24T10:00:00Z'}),detail(conversation,{unreadCount:0,lastMessagePreview:'Changed'})]:
      [detail(),detail(otherConversation,{updatedAt:'2026-09-22T10:00:00Z'})],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail(conversation,{lastSequence:incoming?2:1});
    if(r.path.endsWith('/messages'))return {items:incoming?[message(2)]:[message()],nextAfterSequence:null};
  }});
  const log=h.$('msg-history'),row=h.$('msg-list').firstElementChild,bubble=log.firstElementChild;
  const input=h.$('msg-compose').elements.body;h.input(input,'Still composing');
  Object.defineProperty(log,'scrollHeight',{get:()=>log.children.length*500});
  Object.defineProperty(log,'clientHeight',{get:()=>200});log.scrollTop=50;
  row.focus();incoming=true;h.intervals[1]();await flush();
  assert.equal(h.$('msg-list').lastElementChild,row);assert.equal(h.w.document.activeElement,row);
  assert.equal(row.hasAttribute('aria-label'),false);assert.equal(row.querySelector('.messaging-badge'),null);
  assert.match(row.textContent,/Changed/);
  assert.equal(log.firstElementChild,bubble);assert.equal(log.children.length,2);
  assert.equal(log.scrollTop,50);assert.equal(input.value,'Still composing');
  h.w.ParrotMessaging.setLanguage('es');
  assert.equal(log.firstElementChild,bubble);assert.equal(h.$('msg-list').lastElementChild,row);
});

test('PM140: late prior-account poll cannot install private nodes after replacement',async t=>{
  const late=deferred();let hold=false,second=false;
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations')return hold&&!second?late.promise:
      {items:[detail(conversation,{propertyTitle:second?'Second account':'First account'})],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail(conversation,{propertyTitle:second?'Second account':'First account'});
    if(r.path.endsWith('/messages'))return {items:[message(1,{body:second?'Second private history':'First private history'})],nextAfterSequence:null};
  }});
  h.input(h.$('msg-compose').elements.body,'First private draft');
  hold=true;h.intervals[1]();await flush();
  second=true;h.w.ParrotCore.session.setUser({...user,accountId:'second-account',parrotId:'P669-CCCC-CCCC-CCCC-CCCC'});await flush();
  const row=h.$('msg-list').firstElementChild,bubble=h.$('msg-history').firstElementChild;
  late.resolve({items:[detail(conversation,{propertyTitle:'LATE first account'})],nextCursor:null});await flush();
  assert.equal(h.$('msg-list').firstElementChild,row);assert.equal(h.$('msg-history').firstElementChild,bubble);
  assert.match(h.$('msg-list').textContent,/Second account/);assert.doesNotMatch(h.$('messages-app').textContent,/First private|LATE first/);
  assert.equal(h.$('msg-compose').elements.body.value,'');
  assert.equal(h.w.ParrotCore.storage.session.getItem(`parrot669-draft:${user.accountId}:${conversation}`),null);
});

test('same-account profile notification preserves composer DOM, draft and focus',async t=>{
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:navigationHandler});
  const input=h.$('msg-compose').elements.body;h.input(input,'Unfinished private draft');input.focus();
  h.w.ParrotCore.session.updateProfile({displayName:'Updated profile'});await flush();
  assert.equal(h.$('msg-compose').elements.body,input);assert.equal(input.value,'Unfinished private draft');
  assert.equal(h.w.document.activeElement,input);assert.equal(h.w.ParrotCore.session.user.displayName,'Updated profile');
});

for(const [initial,next] of [[profile,'P669-CCCC-CCCC-CCCC-CCCC'],
  ['P669-8000-0000-0000-0000','P669-8000-0000-0000-0001']])
for(const firstSend of [true,false])test(`PM094 ${initial} ${firstSend?'first send':'reply'} profile identity change retires old ACK and preserves manual retry`,async t=>{
  const late=deferred(),posts=[];let current=initial;
  const h=await harness(t,{sessionUser:{...user,parrotId:initial},url:firstSend?`/messages.html?property=${property}`:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations'&&r.method==='GET')return {items:[detail(conversation,{guestProfileId:current})],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail(conversation,{guestProfileId:current});
    if(r.method==='POST'){
      posts.push(r.body);
      if(posts.length===1)return late.promise;
      const ack=sendAck(r.body,firstSend);(firstSend?ack.message:ack).senderProfileId=current;return ack;
    }
    if(r.path.endsWith('/messages'))return {items:[],nextAfterSequence:null};
  }});
  const form=h.$('msg-compose');h.input(form.elements.body,'Keep the exact unknown attempt');
  h.input(form.elements.from,'2027-05-01');h.input(form.elements.to,'2027-05-04');h.submit(form);await flush();
  const key=`parrot669-draft:${user.accountId}:${firstSend?'property:'+property:conversation}`;
  const before=JSON.parse(h.w.ParrotCore.storage.session.getItem(key));
  current=next;h.w.ParrotCore.session.setUser({...user,parrotId:current});await flush();
  const oldAck=sendAck(posts[0],firstSend);(firstSend?oldAck.message:oldAck).senderProfileId=initial;
  late.resolve(oldAck);await flush();
  const after=JSON.parse(h.w.ParrotCore.storage.session.getItem(key));
  assert.deepEqual(after.pending,before.pending);assert.equal(form.elements.body.value,before.body);
  assert.equal(form.elements.body.disabled,true);assert.equal(posts.length,1,'no automatic resend');
  assert.equal(h.w.ParrotCore.session.user.parrotId,current);
  h.submit(form);await flush();assert.equal(posts.length,2);assert.deepEqual(posts[1],posts[0]);
  assert.equal(form.elements.body.value,'');assert.equal(form.elements.body.disabled,false);
});

test('Messages Back/Forward restores conversation without pushing history or writing', {timeout:2000},async t=>{
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:navigationHandler});
  [...h.$('msg-list').querySelectorAll('button')].find(button=>button.textContent.includes('Room')).click();await flush();
  assert.equal(new URL(h.w.location.href).searchParams.get('conversation'),otherConversation);
  const length=h.w.history.length;
  const traverse=async direction=>{
    const popped=new Promise(resolve=>h.w.addEventListener('popstate',resolve,{once:true}));
    h.w.history[direction]();await popped;await flush();
  };
  await traverse('back');assert.equal(h.$('msg-property').textContent,'Apartment');
  await traverse('forward');assert.equal(h.$('msg-property').textContent,'Room');
  assert.equal(h.w.history.length,length);assert.equal(h.calls.some(call=>call.method!=='GET'),false);
});

test('expired private draft stays hidden, same account restores, explicit logout clears',async t=>{
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:navigationHandler});
  h.input(h.$('msg-compose').elements.body,'Private retained draft');
  h.w.ParrotCore.session.setUser(null,{reason:'expired'});await flush();
  assert.equal(h.$('messages-app').hidden,true);assert.equal(h.$('msg-compose').elements.body.value,'');
  const key=`parrot669-draft:${user.accountId}:${conversation}`;
  assert.equal(JSON.parse(h.w.ParrotCore.storage.session.getItem(key)).body,'Private retained draft');
  h.w.ParrotCore.session.setUser(user);await flush();assert.equal(h.$('msg-compose').elements.body.value,'Private retained draft');
  h.$('msg-logout').click();await flush();assert.equal(h.w.ParrotCore.storage.session.getItem(key),null);
});

async function harness(t,{url='/messages.html',handler=()=>undefined,loggedIn=true,page='messages.html',sessionData={},localData={},sessionUser=user,initialVisibility='visible'}={}) {
  const dom = new JSDOM(file(page),{url:`https://parrot669.com${url}`,runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());
  const w=dom.window, calls=[], intervals=[];
  Object.defineProperty(w.document,'visibilityState',{configurable:true,value:initialVisibility});
  for(const [key,value] of Object.entries(sessionData)) w.sessionStorage.setItem(key,value);
  for(const [key,value] of Object.entries(localData)) w.localStorage.setItem(key,value);
  w.setInterval=fn=>{intervals.push(fn);return intervals.length;};
  w.confirm=()=>true;
  w.fetch=async(raw,options={})=>{
    const request={path:new URL(raw,w.location.origin).pathname,query:new URL(raw,w.location.origin).searchParams,
      method:options.method||'GET',body:options.body?JSON.parse(options.body):null};
    calls.push(request);
    const custom=await handler(request);
    if(custom!==undefined) return custom instanceof Response?custom:response(custom);
    if(request.path==='/api/host/auth/me') return loggedIn?response(sessionUser):response({error:'unauthorized'},401);
    if(request.path==='/api/messaging/unread') return response({conversations:1,messages:1});
    if(request.path==='/api/messaging/notification-settings') return response({enabled:true,language:'en'});
    if(request.path==='/api/messaging/conversations') return response({items:[],nextCursor:null});
    if(request.path===`/api/messaging/conversations/for-property/${property}`) return response(null);
    if(request.path===`/api/messaging/contact-options/${property}`) return response({propertyId:property,propertyTitle:'Apartment',hostDisplayName:'Host',hostProfileId:'P669-AAAA-AAAA-AAAA-AAAA',acceptingNewConversations:true});
    if(request.path.endsWith('/read')) return response({throughSequence:request.body.throughSequence});
    throw Error(`Unexpected request: ${request.method} ${raw}`);
  };
  require('./helpers/core.cjs').installCore(w);
  w.eval(file('assets/messaging-common.js'));
  if(page==='messages.html') { w.eval(file('assets/messaging-email-settings.js')); w.eval(file('assets/messages.js')); }
  await flush();
  return {w,calls,intervals,$:id=>w.document.getElementById(id),submit:form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true})),
    input:(element,value)=>{element.value=value;element.dispatchEvent(new w.Event('input',{bubbles:true}));}};
}

test('initial unread badge loads when a Messages tab starts in the background',async t=>{
  const h=await harness(t,{initialVisibility:'hidden',handler:r=>{
    if(r.path==='/api/messaging/conversations') return {items:[detail()],nextCursor:null};
  }});
  assert.match(h.$('msg-list').textContent,/Unread/);
  assert.equal(h.w.document.querySelector('[data-msg-unread]').hidden,false);
  assert.equal(h.w.document.querySelector('[data-msg-unread]').textContent,'1');
  assert.equal(h.calls.filter(call=>call.path==='/api/messaging/unread').length,1);
  h.intervals[0](); await flush();
  assert.equal(h.calls.filter(call=>call.path==='/api/messaging/unread').length,1);
});

test('PM-049: Messages header has a stable search return and truthful guest and account states',async t=>{
  const guest=await harness(t,{loggedIn:false,url:`/messages.html?property=${property}`});
  assert.equal(guest.$('msg-login-link').hidden,false);
  assert.equal(guest.$('msg-register-link').hidden,false);
  assert.equal(guest.$('msg-account').hidden,true);
  assert.equal(guest.w.document.querySelector('[data-msg-i18n="backToSite"]').getAttribute('href'),'/search.html');
  guest.$('msg-register-link').click();
  assert.equal(guest.$('msg-auth').hidden,false);
  assert.equal(guest.$('msg-login-form').hidden,true);
  assert.equal(guest.$('msg-register-form').hidden,false);
  guest.$('msg-login-link').click();
  assert.equal(guest.$('msg-login-form').hidden,false);
  assert.equal(guest.$('msg-register-form').hidden,true);
  const member=await harness(t,{sessionUser:{...user,email:'private@example.test'}});
  assert.equal(member.$('msg-login-link').hidden,true);
  assert.equal(member.$('msg-register-link').hidden,true);
  assert.equal(member.$('msg-account').hidden,false);
  assert.equal(member.$('msg-account-name').textContent,'guest');
  assert.equal(member.w.document.body.textContent.includes('private@example.test'),false);
  for(const [language,label] of [['en','← Back to site'],['es','← Volver al sitio'],['ca','← Tornar al web'],['ru','← Назад на сайт']]){
    member.w.ParrotMessaging.setLanguage(language);
    assert.equal(member.w.document.querySelector('[data-msg-i18n="backToSite"]').textContent,label);
  }
});

test('PM-050/PM-053: Messages uses localized split hierarchy and has no removed hooks',async t=>{
  const h=await harness(t,{loggedIn:false});
  assert.equal(h.$('msg-refresh'),null);
  assert.equal(h.w.document.querySelector('[data-msg-i18n="privacy"]'),null);
  assert.equal(h.w.document.querySelector('[data-msg-i18n="emailHelp"]'),null);
  const title=h.w.document.querySelector('.messages-intro h1');
  assert.equal(title.querySelectorAll('span').length,2);
  assert.equal(title.querySelector('.messages-title-accent').dataset.msgI18n,'messagesTitleAccent');
  for(const [language,eyebrow,first,accent,lead] of [
    ['en','PRIVATE CONVERSATIONS','Plan the stay.','Keep the conversation together.','Your conversations with hosts and guests live here.'],
    ['es','CONVERSACIONES PRIVADAS','Organiza la estancia.','Mantén la conversación en un solo lugar.','Aquí encontrarás tus conversaciones con propietarios y huéspedes.'],
    ['ca','CONVERSES PRIVADES','Organitza l’estada.','Mantén la conversa en un sol lloc.','Aquí trobaràs les converses amb propietaris i hostes.'],
    ['ru','ЛИЧНЫЕ ДИАЛОГИ','Обсудите поездку.','Сохраните всё в одном диалоге.','Здесь хранятся ваши диалоги с владельцами и гостями.']
  ]){
    h.w.ParrotMessaging.setLanguage(language);
    assert.equal(h.w.document.querySelector('[data-msg-i18n="messagesEyebrow"]').textContent,eyebrow);
    assert.equal(h.w.document.querySelector('[data-msg-i18n="messagesTitleFirst"]').textContent,first);
    assert.equal(h.w.document.querySelector('[data-msg-i18n="messagesTitleAccent"]').textContent,accent);
    assert.equal(h.w.document.querySelector('[data-msg-i18n="messagesLead"]').textContent,lead);
  }
});

test('PM-050: removing Refresh preserves hidden-tab pause, visibility/focus resume and explicit session retry',async t=>{
  let failSession=false;
  const h=await harness(t,{handler:r=>{
    if(r.path==='/api/host/auth/me' && failSession) return response({error:'unavailable'},503);
    if(r.path==='/api/messaging/conversations') return {items:[],nextCursor:null};
  }});
  const inboxCalls=()=>h.calls.filter(call=>call.path==='/api/messaging/conversations').length;
  const initial=inboxCalls();
  Object.defineProperty(h.w.document,'hidden',{configurable:true,value:true});
  Object.defineProperty(h.w.document,'visibilityState',{configurable:true,value:'hidden'});
  h.intervals[1]();await flush();
  assert.equal(inboxCalls(),initial);

  Object.defineProperty(h.w.document,'hidden',{configurable:true,value:false});
  Object.defineProperty(h.w.document,'visibilityState',{configurable:true,value:'visible'});
  h.w.document.dispatchEvent(new h.w.Event('visibilitychange'));await flush();
  assert.ok(inboxCalls()>initial);
  const afterVisibility=inboxCalls();
  h.w.dispatchEvent(new h.w.Event('focus'));await flush();
  assert.ok(inboxCalls()>afterVisibility);

  failSession=true;
  h.w.ParrotMessaging.setUser(null);
  h.$('msg-session-retry').click();await flush();
  assert.equal(h.$('msg-session-retry').hidden,false);
  failSession=false;
  h.$('msg-session-retry').click();await flush();
  assert.equal(h.$('msg-session-retry').hidden,true);
});

test('PM-049: Messages clears private BFCache content before session revalidation',async t=>{
  let session=user;
  const h=await harness(t,{handler:r=>{
    if(r.path==='/api/host/auth/me') return session ? session : response({error:'unauthorized'},401);
    if(r.path==='/api/messaging/conversations') return {items:[detail()],nextCursor:null};
  }});
  assert.equal(h.$('msg-account').hidden,false);
  assert.equal(h.$('msg-list').children.length,1);
  session=null;
  const event=new h.w.Event('pageshow');
  Object.defineProperty(event,'persisted',{value:true});
  h.w.dispatchEvent(event);
  assert.equal(h.$('msg-account').hidden,true);
  assert.equal(h.$('msg-list').children.length,0);
  await flush();
  assert.equal(h.$('msg-login-link').hidden,false);
  assert.equal(h.$('msg-register-link').hidden,false);
  assert.equal(h.calls.filter(call=>call.path==='/api/host/auth/me').length,2);
});

test('polling highlights an incoming conversation before opening it and clears only after server read state changes',async t=>{
  let unread=0, rows=[];
  const h=await harness(t,{handler:r=>{
    if(r.path==='/api/messaging/unread') return {conversations:unread?1:0,messages:unread};
    if(r.path==='/api/messaging/conversations') return {items:rows,nextCursor:null};
  }});
  const nav=h.w.document.querySelector('.messaging-nav-link');
  assert.equal(h.w.document.querySelector('[data-msg-unread]').hidden,true);
  assert.equal(h.$('msg-list').children.length,0);

  unread=1;
  rows=[detail(conversation,{propertyTitle:'A long apartment name with several details',otherDisplayName:'Guest',
    lastMessagePreview:'Is this place free next week?',unreadCount:1})];
  h.intervals[1]();h.intervals[0]();await flush(); // Existing 15s inbox and 30s unread polls.
  const row=h.$('msg-list').firstElementChild;
  assert.equal(row.classList.contains('unread'),true);
  assert.equal(row.getAttribute('aria-current'),'false');
  assert.match(row.textContent,/A long apartment name.*Guest.*Is this place free.*Unread/s);
  assert.equal(row.querySelector('.messaging-badge').textContent,'1');
  assert.equal(h.w.document.querySelector('[data-msg-unread]').hidden,false);
  assert.equal(nav.classList.contains('has-unread'),true);
  assert.match(nav.getAttribute('aria-label'),/1 unread message/);
  for(const [language,label] of [['es','Sin leer'],['ca','Sense llegir'],['ru','Не прочитано'],['en','Unread']]) {
    h.w.ParrotMessaging.setLanguage(language);
    assert.equal(h.$('msg-list').firstElementChild.querySelector('.messages-unread-label').textContent,label);
    assert.ok(nav.getAttribute('aria-label').includes('1 '));
  }

  // A self-sent reply has no incoming unread count according to the existing API contract.
  unread=0;
  rows=[detail(conversation,{propertyTitle:'A long apartment name with several details',otherDisplayName:'Guest',
    lastMessagePreview:'My reply',unreadCount:0})];
  h.intervals[1]();h.intervals[0]();await flush();
  const readRow=h.$('msg-list').firstElementChild;
  assert.equal(readRow.classList.contains('unread'),false);
  assert.equal(readRow.querySelector('.messaging-badge'),null);
  assert.match(readRow.textContent,/Guest.*My reply/s);
  assert.equal(h.w.document.querySelector('[data-msg-unread]').hidden,true);
  assert.equal(nav.classList.contains('has-unread'),false);
});

test('only the conversation host sees a profile link and keeps the same-account thread return',async t=>{
  const owner={accountId:'owner-account',username:'owner',parrotId:'P669-AAAA-AAAA-AAAA-AAAA'};
  const handler=r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`) return detail(conversation,{hostProfileId:'P669-AAAA-AAAA-AAAA-AAAA',guestProfileId:profile});
    if(r.path.endsWith(`/${conversation}/messages`)) return {items:[message()],nextAfterSequence:null};
  };
  const host=await harness(t,{url:`/messages.html?conversation=${conversation}`,sessionUser:owner,handler});
  const link=host.$('msg-own-profile');
  assert.equal(link.hidden,false);
  assert.equal(link.getAttribute('href'),'/my-profile.html?fromMessages=1#host-profile');
  for(const [lang,label] of [['es','Mi perfil'],['ca',"El meu perfil"],['ru','Мой профиль'],['en','My profile']]) {
    host.w.document.querySelector(`[data-msg-lang="${lang}"]`).click();
    assert.equal(link.textContent,label);
  }
  link.addEventListener('click',event=>event.preventDefault()); // Keep the JSDOM tab while testing navigation intent.
  link.click();
  const saved=JSON.parse(host.w.sessionStorage.getItem('parrot669-profile-return'));
  assert.equal(saved.accountId,owner.accountId);
  assert.equal(saved.conversationId,conversation);
  host.w.ParrotMessaging.setUser({...owner,accountId:'other-account'});
  assert.equal(link.hidden,true);
  assert.equal(host.w.sessionStorage.getItem('parrot669-profile-return'),null);

  const guest=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler});
  assert.equal(guest.$('msg-own-profile').hidden,true);
  const loggedOut=await harness(t,{loggedIn:false,url:`/messages.html?property=${property}`});
  assert.equal(loggedOut.$('msg-own-profile').hidden,true);
  assert.equal(loggedOut.calls.some(call=>call.path.includes('/conversations/')),false);
});

test('guest prepares an enquiry before login; sending waits for auth and preserves dates and body',async t=>{
  let sent=null;
  const h=await harness(t,{loggedIn:false,url:`/messages.html?property=${property}&from=2027-05-01&to=2027-05-04`,handler:r=>{
    if(r.path==='/api/host/auth/login') return user;
    if(r.path==='/api/messaging/conversations' && r.method==='POST') {sent=r.body;return sendAck(sent,true);}
    if(r.path===`/api/messaging/conversations/${conversation}`) return detail();
    if(r.path.endsWith(`/${conversation}/messages`)) return {items:[message(1,{...sent,senderProfileId:profile})],nextAfterSequence:null};
  }});
  assert.equal(h.$('msg-auth').hidden,true);
  assert.equal(h.$('msg-inbox').hidden,true);
  assert.equal(h.$('msg-history').hidden,true);
  assert.equal(h.calls.filter(c=>c.path.includes('/conversations/')).length,0);
  const form=h.$('msg-compose');
  assert.equal(form.hidden,false);assert.equal(form.elements.from.value,'2027-05-01');assert.equal(form.elements.to.value,'2027-05-04');
  h.input(form.elements.body,'  <img src=x onerror=alert(1)>  ');
  h.submit(form);await flush();
  assert.equal(h.$('msg-auth').hidden,false);
  assert.match(h.$('msg-auth-lead').textContent,/draft will stay/);
  assert.equal(h.calls.filter(c=>c.path==='/api/messaging/conversations' && c.method==='POST').length,0);
  const login=h.$('msg-login-form'); login.elements.login.value='guest';login.elements.password.value='test-password-123';
  h.submit(login);await flush();
  assert.equal(h.$('msg-auth').hidden,true);assert.equal(h.$('msg-inbox').hidden,false);
  assert.equal(form.elements.body.value,'  <img src=x onerror=alert(1)>  ');
  assert.equal(form.elements.from.value,'2027-05-01');assert.equal(form.elements.to.value,'2027-05-04');
  assert.equal(h.calls.filter(c=>c.path==='/api/messaging/conversations' && c.method==='POST').length,0);
  h.submit(form);await flush();
  assert.equal(sent.propertyId,property);assert.equal(sent.body,'<img src=x onerror=alert(1)>');assert.equal(sent.to,'2027-05-04');
  assert.equal(h.$('msg-history').querySelector('img'),null);
  assert.match(h.$('msg-history').textContent,/<img src=x onerror=alert\(1\)>/);
  assert.equal(h.w.location.search,`?conversation=${conversation}`);
  assert.equal(login.elements.password.value,'');assert.equal(form.elements.body.value,'');
});

test('registration keeps the guest draft until email confirmation; a different account cannot inherit it',async t=>{
  const url=`/messages.html?property=${property}&from=2027-05-01&to=2027-05-04&verifyCalendar=1`;
  const h=await harness(t,{url,loggedIn:false,handler:r=>r.path==='/api/host/auth/register'?{message:'check email'}:undefined});
  const form=h.$('msg-compose');
  assert.match(form.elements.body.value,/calendar/);
  h.input(form.elements.body,'Please confirm dates before I book');h.submit(form);await flush();
  const registerTab=h.w.document.querySelector('[data-msg-auth="register"]');registerTab.click();
  const register=h.$('msg-register-form');
  register.elements.username.value='guest';register.elements.displayName.value='Guest';
  register.elements.email.value='guest@example.test';register.elements.password.value='long-password-123';
  h.submit(register);await flush();
  assert.equal(h.calls.filter(c=>c.path==='/api/messaging/conversations' && c.method==='POST').length,0);
  h.input(form.elements.body,'Latest draft after registration');
  const saved=Object.fromEntries(Array.from({length:h.w.sessionStorage.length},(_,i)=>{
    const key=h.w.sessionStorage.key(i);return [key,h.w.sessionStorage.getItem(key)];
  }));
  assert.match(saved[`parrot669-guest-draft:property:${property}`],/Latest draft after registration/);
  const local=Object.fromEntries(Array.from({length:h.w.localStorage.length},(_,i)=>{
    const key=h.w.localStorage.key(i);return [key,h.w.localStorage.getItem(key)];
  }));
  assert.equal(JSON.parse(local['parrot669-registration-draft']).username,'guest');
  assert.equal(JSON.parse(local['parrot669-registration-draft']).draft.body,'Latest draft after registration');
  assert.equal(JSON.parse(h.w.localStorage.getItem('parrot669-message-return')).path,url);

  const anotherTab=await harness(t,{url,loggedIn:false,localData:local});
  anotherTab.input(anotherTab.$('msg-compose').elements.body,'Unrelated tab');
  assert.equal(JSON.parse(anotherTab.w.localStorage.getItem('parrot669-registration-draft')).draft.body,'Latest draft after registration');

  const different=await harness(t,{url,sessionData:saved,sessionUser:{...user,accountId:'other-account',username:'other'}});
  assert.notEqual(different.$('msg-compose').elements.body.value,'Latest draft after registration');
  assert.equal(different.$('msg-inbox').hidden,false);

  const differentLogin=await harness(t,{url,loggedIn:false,sessionData:saved,localData:local,
    handler:r=>r.path==='/api/host/auth/login'?{...user,accountId:'other-account',username:'other'}:undefined});
  differentLogin.$('msg-login-form').elements.login.value='other';
  differentLogin.$('msg-login-form').elements.password.value='test-password-123';
  differentLogin.submit(differentLogin.$('msg-login-form'));await flush();
  assert.notEqual(differentLogin.$('msg-compose').elements.body.value,'Latest draft after registration');
  assert.equal(JSON.parse(differentLogin.w.localStorage.getItem('parrot669-registration-draft')).draft.body,'Latest draft after registration');

  const verified=await harness(t,{url,localData:local}); // Email link opened in a separate tab.
  assert.equal(verified.$('msg-compose').elements.body.value,'Latest draft after registration');
  assert.equal(verified.$('msg-compose').elements.from.value,'2027-05-01');
  assert.equal(verified.$('msg-compose').elements.to.value,'2027-05-04');
  assert.equal(verified.w.localStorage.getItem('parrot669-registration-draft'),null);
  assert.equal(verified.calls.filter(c=>c.method==='POST').length,0);
});

test('direct Messages entry explains private inbox; guest composer and auth gate translate in four languages',async t=>{
  const direct=await harness(t,{loggedIn:false});
  assert.equal(direct.$('msg-auth').hidden,false);
  assert.equal(direct.$('messages-app').hidden,true);
  assert.match(direct.$('msg-auth-lead').textContent,/private conversations/);
  assert.equal(direct.$('msg-find-housing').getAttribute('href'),'/search.html');
  assert.equal(direct.calls.filter(c=>c.path.startsWith('/api/messaging/conversations')).length,0);
  const h=await harness(t,{loggedIn:false,url:`/messages.html?property=${property}`});
  const labels={en:/Log in or create an account/,es:/Entra o crea una cuenta/,ca:/Entra o crea un compte/,ru:/войдите или создайте аккаунт/i};
  for(const [lang,expected] of Object.entries(labels)){
    h.w.ParrotMessaging.setLanguage(lang);
    assert.match(h.$('msg-guest-hint').textContent,expected);
  }
  h.input(h.$('msg-compose').elements.body,'Hello');h.submit(h.$('msg-compose'));await flush();
  assert.match(h.$('msg-auth-lead').textContent,/Войдите или создайте аккаунт/);
  assert.equal(h.$('msg-inbox').hidden,true);
  assert.equal(h.calls.filter(c=>c.path.startsWith('/api/messaging/conversations')).length,0);
});

test('only the owner sees a link to this conversation’s existing property',async t=>{
  const owner={...user,accountId:'owner-account',username:'owner',parrotId:'P669-AAAA-AAAA-AAAA-AAAA'};
  const metadata=detail(conversation,{hostProfileId:'P669-AAAA-AAAA-AAAA-AAAA',guestProfileId:profile});
  const handler=r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`) return metadata;
    if(r.path.endsWith(`/${conversation}/messages`)) return {items:[message()],nextAfterSequence:null};
  };
  const url=`/messages.html?conversation=${conversation}`;
  const host=await harness(t,{url,sessionUser:owner,handler});
  const link=host.$('msg-open-property');
  assert.equal(link.hidden,false);
  assert.equal(link.getAttribute('href'),`/host.html?property=${property}&conversation=${conversation}`);
  for(const [language,label] of Object.entries({en:/Open property/,es:/Abrir vivienda/,ca:/Obrir habitatge/,ru:/Открыть объект/})){
    host.w.ParrotMessaging.setLanguage(language);assert.match(link.textContent,label);
  }
  const guest=await harness(t,{url,handler});
  assert.equal(guest.$('msg-open-property').hidden,true);
  assert.equal(guest.$('msg-open-property').hasAttribute('href'),false);
  const deleted=await harness(t,{url,sessionUser:owner,handler:r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`) return {...metadata,propertyId:null,canReply:false};
    if(r.path.endsWith(`/${conversation}/messages`)) return {items:[message()],nextAfterSequence:null};
  }});
  assert.equal(deleted.$('msg-open-property').hidden,true);
  assert.equal(deleted.$('msg-open-property').hasAttribute('href'),false);
  host.w.ParrotMessaging.setUser(null);
  await flush();
  assert.equal(link.hidden,true);
  assert.equal(link.hasAttribute('href'),false);
});

test('guest draft survives a same-tab reload for 24 hours and invalid dates do not open auth',async t=>{
  const url=`/messages.html?property=${property}&from=2027-06-01&to=2027-06-04`;
  const h=await harness(t,{url,loggedIn:false});
  const form=h.$('msg-compose');h.input(form.elements.body,'A quiet room, please');
  h.input(form.elements.to,'2027-05-31');h.submit(form);await flush();
  assert.equal(h.$('msg-auth').hidden,true);
  assert.equal(h.calls.filter(c=>c.method==='POST').length,0);
  h.input(form.elements.to,'2027-06-04');
  const key=`parrot669-guest-draft:property:${property}`;
  const stored=h.w.sessionStorage.getItem(key);
  const resumed=await harness(t,{url,loggedIn:false,sessionData:{[key]:stored}});
  assert.equal(resumed.$('msg-compose').elements.body.value,'A quiet room, please');
  assert.equal(resumed.$('msg-compose').elements.to.value,'2027-06-04');
  const expired=await harness(t,{url,loggedIn:false,sessionData:{[key]:JSON.stringify({...JSON.parse(stored),savedAt:Date.now()-86400001})}});
  assert.equal(expired.$('msg-compose').elements.body.value,'');
});

test('uncertain delivery retains a stable idempotency key; a rate error remains visible and editable',async t=>{
  const attempts=[];let success=false;
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`) return detail();
    if(r.path.endsWith('/messages') && r.method==='GET') return {items:success?[message(2,{...attempts.at(-1),senderProfileId:profile})]:[message()],nextAfterSequence:null};
    if(r.path.endsWith('/messages') && r.method==='POST') {
      attempts.push(r.body);
      if(attempts.length===1) throw Error('Connection lost');
      if(attempts.length===2) {success=true;return sendAck(r.body,false,2);}
      return response({code:'RATE_LIMITED',error:'too many'},429);
    }
  }});
  const form=h.$('msg-compose');h.input(form.elements.body,'Hello');h.submit(form);await flush();
  assert.equal(form.elements.body.disabled,true);assert.match(h.$('msg-send').textContent,/Retry/);
  h.submit(form);await flush();
  assert.deepEqual(attempts[0],attempts[1]);assert.equal(form.elements.body.disabled,false);
  h.input(form.elements.body,'Another');h.submit(form);await flush();
  assert.match(h.$('msg-thread-notice').textContent,/Too many/);assert.equal(form.elements.body.disabled,false);
  assert.equal(form.elements.body.value,'Another');
});

test('send refresh starts at the last fetched cursor and does not skip a concurrent incoming message',async t=>{
  let sent=null;const after=[];
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`) return detail();
    if(r.path.endsWith('/messages') && r.method==='POST') {sent=r.body;return sendAck(sent,false,3);}
    if(r.path.endsWith('/messages')) {after.push(r.query.get('afterSequence'));return {items:sent?[message(2,{body:'Incoming'}),sendAck(sent,false,3)]:[message()],nextAfterSequence:null};}
  }});
  h.input(h.$('msg-compose').elements.body,'Outgoing');h.submit(h.$('msg-compose'));await flush();
  assert.deepEqual(after,['0','1']);assert.match(h.$('msg-history').textContent,/Incoming/);
  assert.equal(h.$('msg-history').children.length,3);
});

test('late block metadata cannot overwrite another selected conversation; account switch clears private content',async t=>{
  const late=deferred();let blocking=false;
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations') return {items:[detail(),detail(otherConversation)],nextCursor:null};
    if(r.path.endsWith('/block')) {blocking=true;return {blocked:true};}
    if(r.path===`/api/messaging/conversations/${conversation}`) return blocking?late.promise:detail();
    if(r.path===`/api/messaging/conversations/${otherConversation}`) return detail(otherConversation);
    if(r.path.endsWith('/messages')) return {items:[message()],nextAfterSequence:null};
  }});
  h.$('msg-block').click();await flush();
  [...h.$('msg-list').children].find(el=>el.textContent.includes('Room')).click();await flush();
  late.resolve(detail(conversation,{blockedByMe:true,canReply:false}));await flush();
  assert.equal(h.$('msg-property').textContent,'Room');assert.equal(h.$('msg-compose').hidden,false);
  h.input(h.$('msg-compose').elements.body,'Private draft');
  h.w.ParrotMessaging.setUser(null);await flush();
  assert.equal(h.$('msg-history').textContent,'');assert.equal(h.$('msg-compose').elements.body.value,'');
  assert.equal(h.$('msg-property').textContent,'');assert.equal(h.$('msg-other').textContent,'');
  h.w.history.replaceState(null,'','/messages.html');
  h.w.ParrotMessaging.setUser({...user,accountId:'another-account',parrotId:'P669-CCCC-CCCC-CCCC-CCCC'});await flush();
  assert.equal(h.$('msg-compose').elements.body.value,'');
});

test('existing conversation remains usable with legacy opt-out; invalid checkout dates prevent sending',async t=>{
  const h=await harness(t,{url:`/messages.html?property=${property}&from=2027-05-01&to=2027-05-04`,handler:r=>{
    if(r.path.includes('/contact-options/')) return {acceptingNewConversations:false};
    if(r.path.includes('/for-property/')) return detail();
    if(r.path.endsWith('/messages')) return {items:[message()],nextAfterSequence:null};
  }});
  assert.equal(h.$('msg-compose').hidden,false);
  const form=h.$('msg-compose');h.input(form.elements.body,'One night');h.input(form.elements.to,'2027-05-01');
  h.submit(form);await flush();
  assert.equal(h.calls.filter(r=>r.method==='POST').length,0);
  assert.notEqual(form.elements.to.validationMessage,'');
});

test('read acknowledgements require visible focused history and the latest messages in view',async t=>{
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`) return detail();
    if(r.path.endsWith('/messages')) return {items:[message()],nextAfterSequence:null};
  }});
  assert.equal(h.calls.filter(r=>r.path.endsWith('/read')).length,0);
  const history=h.$('msg-history');history.getClientRects=()=>[{}];h.w.document.hasFocus=()=>true;
  Object.defineProperty(history,'scrollHeight',{value:1000});Object.defineProperty(history,'clientHeight',{value:200});
  history.scrollTop=0;history.dispatchEvent(new h.w.Event('scroll'));await flush();
  assert.equal(h.calls.filter(r=>r.path.endsWith('/read')).length,0);
  history.scrollTop=800;history.dispatchEvent(new h.w.Event('scroll'));await flush();
  assert.equal(h.calls.find(r=>r.path.endsWith('/read')).body.throughSequence,1);
});

test('host has no switch that claims to disable guest enquiries',async t=>{
  const h=await harness(t,{page:'host.html',url:'/host.html'});
  h.w.ParrotMessaging.setUser(user);await flush();
  assert.equal(h.$('messaging-host-enabled'),null);
  assert.equal(h.calls.filter(r=>r.path==='/api/messaging/settings').length,0);
});

test('search always shows contact and dates, even with legacy opt-out or failed options request',async t=>{
  const h=await harness(t,{page:'search.html',url:'/search.html',loggedIn:false,handler:r=>{
    if(r.path.includes('/contact-options/')) return {acceptingNewConversations:false,hostProfileId:'P669-AAAA-AAAA-AAAA-AAAA'};
  }});
  const container=h.w.document.createElement('div');h.w.document.body.append(container);
  h.w.ParrotMessaging.attachContact(container,{propertyId:property,availableFrom:'2027-05-01',availableTo:'2027-05-04',links:[]});
  await flush();const link=container.querySelector('a');assert.equal(link.hidden,false);
  assert.equal(new URL(link.href).searchParams.get('to'),'2027-05-04');
  h.w.ParrotMessaging.setLanguage('ru');assert.equal(link.textContent,'Написать владельцу');
  const nudgeContainer=h.w.document.createElement('div');h.w.document.body.append(nudgeContainer);
  h.w.ParrotMessaging.attachContact(nudgeContainer,{propertyId:property,links:[{calendarControlStatus:'unverified'}]});
  await flush();assert.equal(nudgeContainer.querySelector('.availability-verify-nudge').hidden,false);
});

test('legacy opt-out cannot disable first message in the guest composer',async t=>{
  const h=await harness(t,{url:`/messages.html?property=${property}`,handler:r=>{
    if(r.path.includes('/contact-options/')) return {propertyTitle:'Apartment',hostDisplayName:'Host',hostProfileId:'P669-AAAA-AAAA-AAAA-AAAA',acceptingNewConversations:false};
  }});
  assert.equal(h.$('msg-compose').hidden,false);
  assert.equal(h.$('msg-send').disabled,false);
});

test('email settings persist both preference and language; failed changes restore server state',async t=>{
  let saved={enabled:true,language:'ru'},fail=false;
  const h=await harness(t,{handler:r=>{
    if(r.path==='/api/messaging/notification-settings') {
      if(r.method==='PUT') {if(fail)return response({error:'unavailable'},503);saved=r.body;}
      return saved;
    }
  }});
  const toggle=h.$('msg-email-enabled'),language=h.$('msg-email-language');
  assert.equal(toggle.checked,true);assert.equal(language.value,'ru');
  toggle.checked=false;toggle.dispatchEvent(new h.w.Event('change'));await flush();
  assert.deepEqual(saved,{enabled:false,language:'ru'});
  fail=true;toggle.checked=true;toggle.dispatchEvent(new h.w.Event('change'));await flush();
  assert.equal(toggle.checked,false);assert.match(h.$('msg-email-status').textContent,/connect/i);
  h.w.ParrotMessaging.setUser(null);assert.equal(h.$('msg-email-settings').hidden,true);
});

test('late email preference response is discarded after switching accounts',async t=>{
  const late=deferred();let reads=0;
  const h=await harness(t,{handler:r=>{
    if(r.path==='/api/messaging/notification-settings') return ++reads===1?late.promise:{enabled:false,language:'ca'};
  }});
  h.w.ParrotMessaging.setUser({...user,accountId:'different-account'});await flush();
  late.resolve({enabled:true,language:'ru'});await flush();
  assert.equal(h.$('msg-email-enabled').checked,false);assert.equal(h.$('msg-email-language').value,'ca');
});

test('PM-002: verification nudge prepares an unsent draft regardless of legacy opt-in',async t=>{
  const h=await harness(t,{url:`/messages.html?property=${property}&verifyCalendar=1`});
  const compose=h.$('msg-compose');
  assert.equal(compose.hidden,false);
  assert.match(compose.elements.body.value,/calendar/);
  assert.equal(h.calls.filter(call=>call.method==='POST').length,0);
  const links=h.w.document.createElement('div');
  h.w.ParrotMessaging.attachContact(links,{propertyId:property,links:[{calendarControlStatus:'unverified'}]});
  await flush();
  assert.equal(links.querySelector('.availability-verify-nudge').hidden,false);
  assert.match(links.querySelector('.availability-verify-nudge').href,/verifyCalendar=1/);
});

test('PM142 S1: owner links and direct action require one factual host side',async t=>{
  const other='P669-AAAA-AAAA-AAAA-AAAA';
  for(const [name,hostProfileId,guestProfileId,allowed] of [
    ['host',profile,other,true],['guest',other,profile,false],
    ['equal sides / actor both',profile,profile,false],['actor neither',other,'P669-CCCC-CCCC-CCCC-CCCC',false],
    ['missing guest',profile,undefined,false],['empty guest',profile,'',false],
    ['blank guest',profile,'   ',false],['missing host',undefined,profile,false],
    ['empty host','',profile,false],['blank host','\t',profile,false],
    ['non-string guest',profile,[other],false]
  ]) await t.test(name,async t=>{
    const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
      if(r.path===`/api/messaging/conversations/${conversation}`)return detail(conversation,{hostProfileId,guestProfileId});
      if(r.path.endsWith('/messages'))return {items:[message()],nextAfterSequence:null};
    }});
    assert.equal(h.$('msg-own-profile').hidden,!allowed);
    assert.equal(h.$('msg-open-property').hidden,!allowed);
    const form=h.$('msg-compose');h.input(form.elements.body,'Unsaved owner-action draft');
    let prevented;
    const link=h.$('msg-own-profile');
    link.addEventListener('click',event=>{prevented=event.defaultPrevented;event.preventDefault();});
    link.dispatchEvent(new h.w.MouseEvent('click',{bubbles:true,cancelable:true}));
    assert.equal(prevented,!allowed,'a hidden direct invocation must enforce the same host fact');
    const saved=JSON.parse(h.w.ParrotCore.storage.session.getItem('parrot669-profile-return'));
    assert.equal(saved?.conversationId??null,allowed?conversation:null);
    assert.equal(form.elements.body.value,'Unsaved owner-action draft');
    assert.ok(h.calls.filter(r=>r.method!=='GET').every(r=>r.method==='PUT'&&r.path===`/api/messaging/conversations/${conversation}/read`));
  });
});

test('PM142 S1: history reconciliation keeps uncertain drafts unless all identity and context facts match',async t=>{
  const client='66666666-6666-4666-8666-666666666666';
  const other='P669-AAAA-AAAA-AAAA-AAAA';
  const scenarios=[
    {name:'matching own reply',clear:true},
    {name:'matching own first send',first:true,clear:true},
    {name:'other sender',sender:other},
    {name:'missing sender',sender:undefined},
    {name:'empty sender',sender:''},
    {name:'blank sender',sender:' '},
    {name:'different valid client',historyClient:'77777777-7777-4777-8777-777777777777'},
    {name:'missing history client',historyClient:undefined},
    {name:'invalid history client',historyClient:'not-a-client-id'},
    {name:'wrong endpoint',endpoint:`/conversations/${otherConversation}/messages`,invalidPending:true},
    {name:'wrong first-send property',first:true,propertyId:otherConversation,invalidPending:true},
    {name:'invalid pending client',client:'not-a-client-id',invalidPending:true},
    {name:'array pending client',client:[client],invalidPending:true},
    {name:'equal sides / ambiguous actor',hostProfileId:profile,guestProfileId:profile},
    {name:'actor outside pair',hostProfileId:other,guestProfileId:'P669-CCCC-CCCC-CCCC-CCCC'},
    {name:'missing participant',hostProfileId:undefined},
    {name:'controller snapshot has null own ID',ownId:null},
    {name:'controller snapshot loses own ID',ownId:undefined,sender:undefined,hostProfileId:undefined},
    {name:'controller snapshot has empty own ID',ownId:'',sender:'',hostProfileId:''},
    {name:'controller snapshot has blank own ID',ownId:' ',sender:' ',hostProfileId:' '}
  ];
  for(const row of scenarios)await t.test(row.name,async t=>{
    const actor=row.actor||user,key=`parrot669-draft:${actor.accountId}:${conversation}`;
    const payload={clientMessageId:Object.hasOwn(row,'client')?row.client:client,body:'Keep this uncertain draft',
      from:'2027-05-01',to:'2027-05-04',...(row.first?{propertyId:row.propertyId||property}:{})};
    const pending={endpoint:row.endpoint||(row.first?'/conversations':`/conversations/${conversation}/messages`),payload};
    const draft={body:payload.body,from:payload.from,to:payload.to,pending,savedAt:Date.now()};
    const h=await harness(t,{sessionUser:actor,handler:r=>{
      if(r.path===`/api/messaging/conversations/${conversation}`)return detail(conversation,{
        ...(Object.hasOwn(row,'hostProfileId')?{hostProfileId:row.hostProfileId}:{}),
        ...(Object.hasOwn(row,'guestProfileId')?{guestProfileId:row.guestProfileId}:{})
      });
      if(r.path.endsWith('/messages'))return {items:[message(1,{
        senderProfileId:Object.hasOwn(row,'sender')?row.sender:profile,
        clientMessageId:Object.hasOwn(row,'historyClient')?row.historyClient:client,
        body:'Readable server history',from:payload.from,to:payload.to
      })],nextAfterSequence:null};
    }});
    // Core rejects malformed flat AuthUser identities. Mutate only an already-adopted
    // synthetic snapshot to exercise the controller's independent defensive checks.
    if(Object.hasOwn(row,'ownId'))h.w.ParrotMessaging.user.parrotId=row.ownId;
    h.w.ParrotCore.storage.session.setItem(key,JSON.stringify(draft));
    h.w.history.replaceState(null,'',`/messages.html?conversation=${conversation}`);
    h.w.dispatchEvent(new h.w.PopStateEvent('popstate'));await flush();
    const form=h.$('msg-compose'),clear=!!row.clear;
    assert.match(h.$('msg-history').textContent,/Readable server history/);
    assert.equal(h.$('msg-history').querySelector('time').dateTime,'2026-09-23T10:00:00Z');
    assert.equal(form.elements.body.value,clear?'':draft.body);
    assert.equal(form.elements.from.value,clear?'':draft.from);
    assert.equal(form.elements.to.value,clear?'':draft.to);
    assert.equal(form.elements.body.disabled,!clear&&!row.invalidPending);
    assert.equal(/Retry/.test(h.$('msg-send').textContent),!clear&&!row.invalidPending);
    const saved=h.w.ParrotCore.storage.session.getItem(key);
    if(clear)assert.equal(saved,null);
    else assert.deepEqual(JSON.parse(saved),draft,'reading history must not discard or rewrite the saved attempt');
    if(!row.clear&&!row.invalidPending&&!row.actor&&!Object.hasOwn(row,'ownId')){
      assert.equal(h.$('msg-own-profile').hidden,true);
    }
    assert.ok(h.calls.filter(r=>r.method!=='GET').every(r=>r.method==='PUT'&&r.path===`/api/messaging/conversations/${conversation}/read`));
  });
});

test('PM142 S1: first enquiry requires factual non-self identities without writing',async t=>{
  for(const [name,sessionUser,hostProfileId,canReply]of[
    ['known other',user,'P669-AAAA-AAAA-AAAA-AAAA',true],
    ['self',user,profile,false],['missing host',user,undefined,false],['empty host',user,'',false],
    ['blank host',user,' ',false],['non-string host',user,[profile],false]
  ])await t.test(name,async t=>{
    const h=await harness(t,{url:`/messages.html?property=${property}`,sessionUser,handler:r=>{
      if(r.path===`/api/messaging/contact-options/${property}`)return {
        propertyId:property,propertyTitle:'Known apartment',hostDisplayName:'Host',hostProfileId
      };
    }});
    assert.equal(h.$('msg-property').textContent,'Known apartment');
    assert.equal(h.$('msg-compose').hidden,!canReply);
    assert.equal(h.$('msg-own-profile').hidden,true);
    assert.equal(h.$('msg-open-property').hidden,true);
    assert.equal(h.calls.filter(r=>r.method!=='GET').length,0);
  });
});

test('PM142 S1: malformed session profile IDs never authorize private actions through the strict core',async t=>{
  for(const id of [undefined,null,'',' ',[],123,'11111111-1111-4111-8111-111111111111'])await t.test(JSON.stringify(id)??'missing',async t=>{
    const h=await harness(t,{url:`/messages.html?property=${property}`,sessionUser:{...user,parrotId:id}});
    assert.equal(h.$('msg-own-profile').hidden,true);
    assert.equal(h.$('msg-open-property').hidden,true);
    assert.equal(h.w.ParrotMessaging.user?.accountId,undefined);
    // Anonymous preparation is allowed; an invalid session cannot turn it into a send.
    const form=h.$('msg-compose');h.input(form.elements.body,'Unsent guest preparation');
    h.submit(form);await flush();
    assert.equal(h.$('msg-auth').hidden,false);
    assert.equal(h.calls.filter(r=>r.method!=='GET').length,0);
  });
});

for(const [locale,hostLabel,unknownLabel] of [['en','Host','Participant unavailable'],['es','Propietario','Participante no disponible'],['ca','Amfitrió','Participant no disponible'],['ru','Владелец','Участник недоступен']])
test(`S2 ${locale}: factual grouped authors, unknown fallback and keyed language continuity`,async t=>{
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations')return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.path.endsWith('/messages'))return {items:[message(1),message(2),message(3,{senderProfileId:'unknown'}),message(4,{senderProfileId:profile})],nextAfterSequence:null};
  }});
  const body=h.$('msg-compose').elements.body;h.input(body,'Retained draft');body.focus();body.setSelectionRange(3,5);
  const bubbles=[...h.$('msg-history').children],row=h.$('msg-list').firstElementChild;
  h.w.ParrotMessaging.setLanguage(locale);
  assert.match(bubbles[0].querySelector('.message-author').textContent,new RegExp(hostLabel));
  assert.equal(bubbles[1].querySelector('.message-author'),null);
  assert.equal(bubbles[1].getAttribute('aria-labelledby'),bubbles[0].getAttribute('aria-labelledby'));
  assert.match(bubbles[2].querySelector('.message-author').textContent,new RegExp(unknownLabel));
  for(let i=0;i<4;i++){
    assert.equal(h.$('msg-history').children[i],bubbles[i]);assert.equal(bubbles[i].getAttribute('role'),'group');
    assert.ok(h.w.document.getElementById(bubbles[i].getAttribute('aria-labelledby')));
    assert.equal(bubbles[i].querySelector('.message-body').textContent,`Message ${i+1}`);
  }
  assert.equal(h.$('msg-list').firstElementChild,row);assert.equal(h.w.document.activeElement,body);
  assert.equal(body.selectionStart,3);assert.equal(body.selectionEnd,5);assert.equal(body.value,'Retained draft');
  h.w.ParrotMessaging.setUser(null);await flush();assert.equal(h.$('messages-app').hidden,true);assert.equal(body.value,'');
});

test('S2 earlier page regroups ARIA without replacing keyed bodies or losing scroll anchor',async t=>{
  let older=false;
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail(conversation,{lastSequence:52});
    if(r.path.endsWith('/messages'))return {items:older?[message(1),message(2),message(3)]:[message(3)],nextAfterSequence:null};
  }});
  const history=h.$('msg-history'),bubble=history.firstElementChild,body=bubble.querySelector('.message-body');
  Object.defineProperty(history,'clientHeight',{configurable:true,value:100});
  Object.defineProperty(history,'scrollHeight',{configurable:true,get:()=>history.children.length*100});history.scrollTop=12;
  older=true;h.$('msg-earlier').click();await flush();
  assert.equal(history.children[2],bubble);assert.equal(bubble.querySelector('.message-body'),body);
  assert.equal(bubble.querySelector('.message-author'),null);assert.equal(bubble.getAttribute('aria-labelledby'),'msg-author-1');
  assert.equal(history.scrollTop,212);assert.equal(history.children[0].querySelector('.message-author').id,'msg-author-1');
});

test('S2 inbox Retry recovers without mutations and Back returns to retained row focus',async t=>{
  let fail=true;
  const h=await harness(t,{handler:r=>{
    if(r.path==='/api/messaging/conversations')return fail?response({error:'offline'},503):{items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.path.endsWith('/messages'))return {items:[message()],nextAfterSequence:null};
  }});
  assert.equal(h.$('msg-inbox-retry').hidden,false);fail=false;h.$('msg-inbox-retry').click();await flush();
  const row=h.$('msg-list').firstElementChild;row.focus();row.click();await flush();h.$('msg-back').click();
  assert.equal(h.w.document.activeElement,row);assert.equal(h.$('msg-list').firstElementChild,row);
  assert.equal(h.$('msg-inbox-retry').hidden,true);assert.equal(h.calls.some(r=>r.method==='POST'),false);
});

test('S2 changed same-account participant facts relabel retained groups and clear private role on logout',async t=>{
  let facts=detail();
  const h=await harness(t,{url:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations')return {items:[facts],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return facts;
    if(r.path.endsWith('/messages'))return {items:[message(1,{senderProfileId:profile})],nextAfterSequence:null};
  }});
  const bubble=h.$('msg-history').firstElementChild,body=h.$('msg-compose').elements.body;
  h.input(body,'Keep private draft');body.focus();body.setSelectionRange(2,6);
  h.w.ParrotMessaging.setUser({...user,displayName:'Updated name'});await flush();
  assert.equal(h.$('msg-history').firstElementChild,bubble);assert.match(bubble.querySelector('.message-author').textContent,/Updated name.*guest/);
  facts=detail(conversation,{guestProfileId:null});h.intervals[1]();await flush();
  assert.equal(h.$('msg-history').firstElementChild,bubble);assert.match(bubble.querySelector('.message-author').textContent,/Updated name.*You$/);
  assert.equal(bubble.dataset.senderRole,'unknown');assert.equal(h.$('msg-own-profile').hidden,true);
  assert.equal(h.$('msg-open-property').hasAttribute('href'),false);assert.equal(body.value,'Keep private draft');
  assert.equal(h.w.document.activeElement,body);assert.equal(body.selectionStart,2);assert.equal(body.selectionEnd,6);
  h.w.ParrotMessaging.setUser(null);await flush();assert.equal(h.$('msg-current-role').textContent,'');
});


for(const firstSend of [true,false])test(`flat AuthUser metadata update preserves the pending ${firstSend?'first-send':'reply'} ACK`,async t=>{
  const held=deferred(),posts=[];let committed=null;
  const h=await harness(t,{url:firstSend?`/messages.html?property=${property}`:`/messages.html?conversation=${conversation}`,handler:r=>{
    if(r.path==='/api/messaging/conversations'&&r.method==='GET')return {items:[detail()],nextCursor:null};
    if(r.path===`/api/messaging/conversations/${conversation}`)return detail();
    if(r.path.endsWith('/messages')&&r.method==='GET')return {items:committed?[committed]:[],nextAfterSequence:null};
    if(r.method==='POST'){posts.push(r);return held.promise;}
  }});
  const form=h.$('msg-compose'),input=form.elements.body;
  h.input(input,'Keep pending intent');h.submit(form);await flush();
  const session=h.w.ParrotCore.session,epoch=session.epoch;
  const key=`parrot669-draft:${user.accountId}:${firstSend?'property:'+property:conversation}`;
  const saved=session.user&&h.w.ParrotCore.storage.session.getItem(key);
  assert.ok(saved);assert.equal(posts.length,1);
  session.updateProfile({displayName:'Renamed while sending',parrotId:'P669-CCCC-CCCC-CCCC-CCCC'});await flush();
  assert.equal(session.epoch,epoch);assert.equal(session.user.parrotId,profile);
  assert.equal(Object.hasOwn(session.user,'profile'),false);assert.equal(form.elements.body,input);
  assert.equal(h.w.ParrotCore.storage.session.getItem(key),saved);assert.equal(posts.length,1);
  assert.equal(h.$('msg-history').children.length,0,'history stays empty until the POST commits');
  const ack=sendAck(posts[0].body,firstSend);committed=firstSend?ack.message:ack;
  held.resolve(ack);await flush();
  assert.equal(input.value,'');assert.equal(input.disabled,false);assert.equal(posts.length,1);
  assert.match(h.$('msg-history').textContent,/Renamed while sending/);
  assert.equal(h.$('msg-history').lastElementChild.classList.contains('mine'),true);
});
