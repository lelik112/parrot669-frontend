const ids = Object.freeze({
  property: '11111111-1111-4111-8111-111111111111',
  conversation: '33333333-3333-4333-8333-333333333333',
  accountA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  accountB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  profileA: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  profileB: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'
});

const identities = Object.freeze({
  a: Object.freeze({
    accountId: ids.accountA,
    username: 'fixture-guest-a',
    profile: Object.freeze({id: ids.profileA, displayName: 'Fixture guest A'})
  }),
  b: Object.freeze({
    accountId: ids.accountB,
    username: 'fixture-host-b',
    profile: Object.freeze({id: ids.profileB, displayName: 'Fixture host B'})
  })
});

function createAuthMessagingFixture({acknowledge=value=>value}={}) {
  const calls = [];
  const sessions = new Map();
  const messages = [];
  const readThrough = new Map([['a', 0], ['b', 0]]);
  let conversationExists = false;

  const actorKey = user => user?.accountId === ids.accountA ? 'a' : user?.accountId === ids.accountB ? 'b' : null;
  const other = key => key === 'a' ? identities.b : identities.a;
  const lastSequence = () => messages.at(-1)?.sequence || 0;

  function saveMessage(input,user,createdAt) {
    const previous=messages.find(item=>item.senderProfileId===user.profile.id&&item.clientMessageId===input.clientMessageId);
    if(previous)return previous.body===input.body&&previous.from===(input.from??null)&&previous.to===(input.to??null)?previous:null;
    const sequence=messages.length+1;
    const value={id:`77777777-7777-4777-8777-${String(sequence).padStart(12,'0')}`,sequence,
      senderProfileId:user.profile.id,clientMessageId:input.clientMessageId,body:input.body,
      from:input.from??null,to:input.to??null,createdAt};
    messages.push(value);return value;
  }

  function detail(key) {
    return {
      id: ids.conversation,
      propertyId: ids.property,
      propertyTitle: 'Fixture apartment',
      hostProfileId: ids.profileB,
      otherProfileId: other(key).profile.id,
      otherDisplayName: other(key).profile.displayName,
      self: false,
      canReply: true,
      blockedByMe: false,
      blockedByOther: false,
      readThroughSequence: readThrough.get(key) || 0,
      lastSequence: lastSequence()
    };
  }

  function inboxItem(key) {
    const last = messages.at(-1);
    return {
      ...detail(key),
      unreadCount: Math.max(0, lastSequence() - (readThrough.get(key) || 0)),
      lastMessagePreview: last?.body || '',
      updatedAt: last?.createdAt || '2026-09-28T00:00:00.000Z'
    };
  }

  async function install(page, sessionName) {
    if (!['a', 'b'].includes(sessionName)) throw new Error('Fixture session must be a or b');
    sessions.set(sessionName, null);
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType: 'text/css', body: ''}));
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.route('**/api/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();
      const user = sessions.get(sessionName);
      const key = actorKey(user);
      calls.push({session: sessionName, method, path});

      const json = (status, value) => route.fulfill({status, json: value});
      const noContent = () => route.fulfill({status: 204, body: ''});
      const unauthorized = () => json(401, {error: 'unauthorized'});
      const body = () => {
        try { return request.postDataJSON(); } catch { return {}; }
      };

      if (path === '/api/host/auth/me' && method === 'GET')
        return user ? json(200, user) : unauthorized();
      if (path === '/api/host/auth/login' && method === 'POST') {
        const input = body();
        const selected = Object.values(identities).find(candidate => candidate.username === input.login);
        if (!selected || input.password !== 'fixture-only-pass') return unauthorized();
        sessions.set(sessionName, selected);
        return json(200, selected);
      }
      if (path === '/api/host/auth/logout' && method === 'POST') {
        sessions.set(sessionName, null);
        return noContent();
      }

      if (!key) return unauthorized();
      if (path === '/api/messaging/contact-options/' + ids.property && method === 'GET')
        return json(200, {propertyId: ids.property, propertyTitle: 'Fixture apartment',
          hostDisplayName: identities.b.profile.displayName, hostProfileId: ids.profileB,
          acceptingNewConversations: true});
      if (path === '/api/messaging/conversations/for-property/' + ids.property && method === 'GET')
        return json(200, conversationExists ? detail(key) : null);
      if (path === '/api/messaging/conversations' && method === 'POST') {
        const input = body();
        if (key !== 'a' || input.propertyId !== ids.property || !input.clientMessageId || !input.body)
          return json(400, {error: 'invalid synthetic request'});
        conversationExists = true;
        const message=saveMessage(input,user,'2026-09-28T02:55:00.000Z');
        if(!message)return json(409,{code:'CONFLICT',error:'clientMessageId reused for different content'});
        readThrough.set('a', lastSequence());
        return json(200, acknowledge({conversationId:ids.conversation,message},{firstSend:true,input}));
      }
      if (path === '/api/messaging/conversations' && method === 'GET')
        return json(200, {items: conversationExists ? [inboxItem(key)] : [], nextCursor: null});
      if (path === '/api/messaging/unread' && method === 'GET')
        return json(200, {conversations: conversationExists && lastSequence() > (readThrough.get(key) || 0) ? 1 : 0,
          messages: Math.max(0, lastSequence() - (readThrough.get(key) || 0))});
      if (path === '/api/messaging/notification-settings' && method === 'GET')
        return json(200, {enabled: false, language: 'en'});
      if (path === '/api/messaging/conversations/' + ids.conversation && method === 'GET')
        return conversationExists ? json(200, detail(key)) : json(404, {error: 'not found'});
      if (path === '/api/messaging/conversations/' + ids.conversation + '/messages' && method === 'GET') {
        const after = Number(url.searchParams.get('afterSequence')) || 0;
        return json(200, {items: messages.filter(item => item.sequence > after), nextAfterSequence: null});
      }
      if (path === '/api/messaging/conversations/' + ids.conversation + '/messages' && method === 'POST') {
        const input = body();
        if (!conversationExists || !input.clientMessageId || !input.body)
          return json(400, {error: 'invalid synthetic request'});
        const message=saveMessage(input,user,'2026-09-28T02:56:00.000Z');
        if(!message)return json(409,{code:'CONFLICT',error:'clientMessageId reused for different content'});
        readThrough.set(key, lastSequence());
        return json(200, acknowledge(message,{firstSend:false,input}));
      }
      if (path === '/api/messaging/conversations/' + ids.conversation + '/read' && method === 'PUT') {
        const through = Math.min(lastSequence(), Number(body().throughSequence) || 0);
        readThrough.set(key, Math.max(readThrough.get(key) || 0, through));
        return json(200, {throughSequence: readThrough.get(key)});
      }
      return json(501, {error: `Unexpected auth fixture request: ${method} ${path}`});
    });
  }

  return {
    ids, identities, install,
    snapshot: () => ({
      calls: calls.map(call => ({...call})),
      sessions: Object.fromEntries([...sessions].map(([key, value]) => [key, value?.username || null])),
      messages: messages.map(message => ({...message})),
      readThrough: Object.fromEntries(readThrough),
      conversationExists
    }),
    cleanup: () => {
      sessions.clear(); messages.length = 0; calls.length = 0;
      readThrough.set('a', 0); readThrough.set('b', 0); conversationExists = false;
    }
  };
}

module.exports = {createAuthMessagingFixture};
