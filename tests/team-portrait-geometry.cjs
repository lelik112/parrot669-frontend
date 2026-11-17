const assert=require('node:assert/strict');

// Read-only DOM measurement, also used against the existing local browser preview.
function measurePortraits(){
  const box=node=>{
    const r=node.getBoundingClientRect();
    return {x:r.x,y:r.y+window.scrollY,width:r.width,height:r.height};
  };
  return {
    viewport:{width:window.innerWidth,height:window.innerHeight},
    document:{client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth},
    cards:[...document.querySelectorAll('.team-card')].map(card=>{
      const frame=card.querySelector('.team-portrait-frame');
      const image=card.querySelector('img');
      return {member:card.dataset.member,card:box(card),frame:box(frame),image:box(image),copy:box(card.querySelector('.team-card-copy')),
        natural:[image.naturalWidth,image.naturalHeight],loaded:image.complete&&image.naturalWidth>0,
        fit:getComputedStyle(image).objectFit,position:getComputedStyle(image).objectPosition,
        textOverflow:[...card.querySelectorAll('.team-card-copy,.team-bio')].some(n=>n.scrollWidth>n.clientWidth+1)};
    }),
    footer:{outer:box(document.querySelector('.team-footer')),inner:box(document.querySelector('.team-footer-inner')),
      border:getComputedStyle(document.querySelector('.team-footer')).borderTopWidth.replace('px','')*1,
      before:getComputedStyle(document.querySelector('.team-footer'),'::before').content}
  };
}

// 1/32 CSS px allows subpixel layout rounding, not visibly different sizes.
function validateEqualPortraitSizes(cards){
  const members=['alex','mark','codex','masha'];
  const portraits=members.map(member=>{
    const card=cards.find(c=>c.member===member);
    assert.ok(card,`${member}: portrait present`);
    return card;
  });
  let maximumDelta=0;
  for(let i=0;i<portraits.length;i++){
    for(let j=i+1;j<portraits.length;j++){
      for(const box of ['frame','image']){
        for(const dimension of ['width','height']){
          const delta=Math.abs(portraits[i][box][dimension]-portraits[j][box][dimension]);
          maximumDelta=Math.max(maximumDelta,delta);
          assert.ok(delta<=1/32,`${portraits[i].member}/${portraits[j].member}: equal ${box} ${dimension} (delta ${delta})`);
        }
      }
    }
  }
  return {pairs:6,tolerance:1/32,maximumDelta};
}

function validatePortraits(result,width){
  assert.equal(result.viewport.width,width,'actual viewport');
  assert.equal(result.cards.length,9,'nine actual cards');
  assert.ok(result.document.scroll<=result.document.client+1,'no document overflow');
  const equalSize=validateEqualPortraitSizes(result.cards);
  const squareMembers=['alex','mark','codex','masha'];
  const close=(a,b,label)=>assert.ok(Math.abs(a-b)<=1/32,label);
  for(const member of squareMembers){
    const c=result.cards.find(c=>c.member===member);
    assert.ok(c.loaded,`${member}: real image decoded`);
    assert.deepEqual(c.natural,[1254,1254],`${member}: square source`);
    close(c.frame.width,c.frame.height,`${member}: square frame`);
    close(c.image.width,c.image.height,`${member}: square image box`);
    close(c.image.x+c.image.width/2,c.frame.x+c.frame.width/2,`${member}: centered x`);
    close(c.image.y+c.image.height/2,c.frame.y+c.frame.height/2,`${member}: centered y`);
    assert.equal(c.fit,'cover');
    assert.equal(c.position,'50% 50%');
    assert.ok(!c.textOverflow,`${member}: copy stays within card`);
    assert.ok(c.frame.x>=c.card.x&&c.frame.x+c.frame.width<=c.card.x+c.card.width+1/32,`${member}: frame fits available card width`);
    if(width>760&&['codex','masha'].includes(member)){
      const top=c.frame.y-c.card.y;
      const bottom=c.card.y+c.card.height-c.frame.y-c.frame.height;
      assert.ok(top>=28&&bottom>=28,`${member}: both insets retained`);
      close(top,bottom,`${member}: symmetric insets when copy grows`);
      assert.ok(c.frame.x+c.frame.width<=c.copy.x,`${member}: portrait cannot overlap copy`);
    }
  }
  const owner=result.cards.find(c=>c.member==='alexey');
  assert.ok(owner.loaded,'owner image decoded');
  assert.deepEqual(owner.natural,[819,1100],'vertical crop, not square');
  assert.equal(owner.fit,'contain','whole approved crop remains visible');
  assert.equal(owner.position,'50% 50%');
  assert.ok(owner.image.x>=owner.frame.x&&owner.image.y>=owner.frame.y,'owner image starts inside frame');
  assert.ok(owner.image.x+owner.image.width<=owner.frame.x+owner.frame.width+1&&owner.image.y+owner.image.height<=owner.frame.y+owner.frame.height+1,'owner image box stays inside frame');
  // Conservative source rectangle manually checked against the original photograph:
  // x220..575, y650..1520 encloses hood, coat, legs and both shoes.
  // Crop keeps x0..819, y500..1600, leaving >=80 source pixels vertically around the person.
  const scale=Math.min(owner.image.width/819,owner.image.height/1100);
  const dx=(owner.image.width-819*scale)/2;
  const dy=(owner.image.height-1100*scale)/2;
  assert.ok(dx+220*scale>=0&&dx+575*scale<=owner.image.width,'whole person horizontal bounds');
  assert.ok(dy+150*scale>=0&&dy+1020*scale<=owner.image.height,'hood and shoes stay in visible crop');
  close(result.footer.outer.x,0,'footer starts at viewport edge');
  close(result.footer.outer.width,width,'footer boundary spans viewport');
  close(result.footer.border,1,'footer separator retained');
  assert.ok(['none','normal'].includes(result.footer.before),'no detached pseudo separator');
  assert.ok(result.footer.inner.y>=result.footer.outer.y,'footer content follows boundary');
  return {width,squarePortraits:4,equalSize,wholeOwnerPerson:true,footerBoundary:true};
}

module.exports={measurePortraits,validatePortraits,validateEqualPortraitSizes};
