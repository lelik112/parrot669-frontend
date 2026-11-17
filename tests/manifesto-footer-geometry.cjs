const assert=require('node:assert/strict');
const fs=require('node:fs');

// Evaluate this read-only function in a real browser after selecting a locale.
// Range rectangles describe rendered text, not only the surrounding link boxes.
function measureFooterGeometry(){
  const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const footer=document.querySelector('.site-footer');
  const nav=footer.querySelector('.footer-nav');
  const region=selector=>rect(footer.querySelector(selector));
  const style=getComputedStyle(footer),navStyle=getComputedStyle(nav);
  return {width:innerWidth,viewportHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth,
    locale:document.documentElement.lang,footer:rect(footer),nav:rect(nav),brand:region('.footer-brand'),meta:region('.footer-meta'),
    grid:{columns:style.gridTemplateColumns,rows:style.gridTemplateRows,align:style.alignItems,
      navColumn:navStyle.gridColumn,navRow:navStyle.gridRow,navDisplay:navStyle.display,rowGap:(navStyle.rowGap.replace('px','')*1)||0},
    anchors:[...nav.querySelectorAll('a')].map(a=>{
      const range=document.createRange();range.selectNodeContents(a);
      const text=range.getBoundingClientRect(),s=getComputedStyle(a);
      return {text:a.textContent,href:a.getAttribute('href'),box:rect(a),
        textBox:{x:text.x,y:text.y,width:text.width,height:text.height,right:text.right,bottom:text.bottom},
        lines:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),
        display:s.display,align:s.alignItems,font:s.font,minHeight:s.minHeight};
    })};
}

function validateFooterGeometry(g){
  const tolerance=1,failures=[],rows=[];
  const require=(condition,message)=>{if(!condition)failures.push(message);};
  const center=r=>r.y+r.height/2;
  const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>tolerance&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>tolerance;
  require(g.anchors.length===6,'six footer anchors');
  require(JSON.stringify(g.anchors.map(a=>a.href))===JSON.stringify(
    ['#services','#about','/team.html','#contact','/host.html','/manifesto.html']),'exact footer destinations/order');
  require(g.scrollWidth<=g.width+tolerance,'document horizontal overflow');
  for(const a of g.anchors){
    require(a.box.height>=44-tolerance/100,`${a.text}: touch height ${a.box.height}`);
    require(a.box.x>=-tolerance&&a.box.right<=g.width+tolerance,`${a.text}: horizontal bounds`);
    require(a.textBox.x>=a.box.x-tolerance&&a.textBox.right<=a.box.right+tolerance&&a.textBox.y>=a.box.y-tolerance&&a.textBox.bottom<=a.box.bottom+tolerance,`${a.text}: text clipping`);
    let row=rows.find(r=>Math.abs(r.top-a.box.y)<=tolerance);
    if(!row){row={top:a.box.y,links:[]};rows.push(row);}row.links.push(a);
  }
  rows.sort((a,b)=>a.top-b.top);
  for(const row of rows){
    const centers=row.links.map(a=>center(a.textBox));
    require(Math.max(...centers)-Math.min(...centers)<=tolerance,`row ${row.top}: text center spread ${Math.max(...centers)-Math.min(...centers)}`);
  }
  for(let i=0;i<g.anchors.length;i++)for(let j=i+1;j<g.anchors.length;j++)require(!overlaps(g.anchors[i].box,g.anchors[j].box),`links ${i}/${j}: overlap`);
  for(const [a,b] of [[g.nav,g.brand],[g.nav,g.meta],[g.brand,g.meta]])require(!overlaps(a,b),'footer regions overlap');
  if(rows.length){
    const occupied=Math.max(...g.anchors.map(a=>a.box.bottom))-rows[0].top;
    require(Math.abs(g.nav.height-occupied)<=tolerance,'unexpected unoccupied nav height');
    for(let i=1;i<rows.length;i++){
      const previous=Math.max(...rows[i-1].links.map(a=>a.box.bottom));
      require(Math.abs(rows[i].top-previous-g.grid.rowGap)<=tolerance,'unexpected empty nav row/gap');
    }
  }
  if(g.width>980){
    const centers=[g.brand,g.nav,g.meta].map(center);
    require(Math.max(...centers)-Math.min(...centers)<=tolerance,'desktop footer region centers');
  }else if(g.width>640){
    require(g.nav.bottom<=g.brand.y+tolerance&&g.brand.bottom<=g.meta.y+tolerance,'intermediate grid nav/brand/meta order');
  }else{
    require(g.brand.bottom<=g.nav.y+tolerance&&g.nav.bottom<=g.meta.y+tolerance,'compact grid brand/nav/meta order');
  }
  return {width:g.width,locale:g.locale,pass:failures.length===0,failures,rows:rows.map(r=>({top:r.top,
    labels:r.links.map(a=>a.text),textCenterSpread:Math.max(...r.links.map(a=>center(a.textBox)))-Math.min(...r.links.map(a=>center(a.textBox)))}))};
}

if(require.main===module){
  assert(process.argv[2],'supply a JSON array of actual real-browser measurements');
  const measurements=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  assert(Array.isArray(measurements)&&measurements.length===24,'expected six widths × four locales');
  const combinations=new Set(measurements.map(g=>`${g.width}/${g.locale}`));
  for(const width of [1440,1024,768,708,390,320])for(const locale of ['ru','en','es','ca'])assert(combinations.has(`${width}/${locale}`),'missing width/locale');
  const results=measurements.map(validateFooterGeometry);
  console.log(JSON.stringify(results,null,2));
  assert(results.every(r=>r.pass),`${results.filter(r=>!r.pass).length}/24 footer geometries failed`);
}
module.exports={measureFooterGeometry,validateFooterGeometry};
