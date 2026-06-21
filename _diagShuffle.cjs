const { chromium } = require('playwright-core');

(async () => {
  let browser;
  for (const channel of ['msedge', 'chrome']) {
    try { browser = await chromium.launch({ channel }); break; } catch (e) {}
  }
  if (!browser) { console.log('NO_BROWSER'); process.exit(2); }

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const mode = process.argv[2] || '2';
  await page.getByText('Jugar vs IA').click();
  await page.getByText(`Mesa de ${mode} jugadores`).click();
  await page.locator('.stake-btn').first().click();
  await page.waitForSelector('.game-table');
  await page.waitForTimeout(400);

  const out = await page.evaluate(() => {
    const wrap = document.querySelector('.player-zone .deck-shuffle-wrapper');
    const center = document.querySelector('.center-zone');
    const r = el => { if(!el) return null; const b=el.getBoundingClientRect(); return {w:Math.round(b.width),h:Math.round(b.height),top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right)}; };
    // Inyecta el abanico real (5 cartas con sus ángulos) en el pico de fanOut
    // (rotate(angle) translateY(-16px)) y mide la caja-unión resultante.
    const angles = [-22,-11,0,11,22];
    const nodes = angles.map(a => {
      const f = document.createElement('div');
      f.className = 'shuffle-fan-card';
      f.style.animation = 'none';
      f.style.transform = `rotate(${a}deg) translateY(-16px)`;
      wrap.appendChild(f);
      return f;
    });
    let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity, oneCard=null;
    nodes.forEach((f,i) => { const b=f.getBoundingClientRect(); if(i===2) oneCard={w:Math.round(b.width),h:Math.round(b.height)}; top=Math.min(top,b.top);bottom=Math.max(bottom,b.bottom);left=Math.min(left,b.left);right=Math.max(right,b.right); });
    const fanUnion = {top:Math.round(top),bottom:Math.round(bottom),left:Math.round(left),right:Math.round(right)};
    const cAnim = getComputedStyle(nodes[0]).animationName; // (con animation:none será 'none'; medimos forma estática)
    nodes.forEach(f => wrap.removeChild(f));
    const c = r(center);
    const collide = c && !(fanUnion.right<=c.left || fanUnion.left>=c.right || fanUnion.bottom<=c.top || fanUnion.top>=c.bottom);
    // colisión con contenido real:
    const pot = r(document.querySelector('.pot-box')); const msg = r(document.querySelector('.game-message'));
    const hit = (a,b)=> !a||!b?null:!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);
    return { fanCardSize: oneCard, fanUnion, centerBottom: c?c.bottom:null, fanTop: fanUnion.top, gapToCenterBottom: c? fanUnion.top - c.bottom : null, fanHitsPot: hit(fanUnion,pot), fanHitsMsg: hit(fanUnion,msg) };
  });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
