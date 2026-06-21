const { chromium } = require('playwright-core');

(async () => {
  let browser;
  for (const channel of ['msedge', 'chrome']) {
    try { browser = await chromium.launch({ channel }); break; }
    catch (e) { /* try next */ }
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
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const r = el => { if(!el) return null; const b = el.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),w:Math.round(b.width),h:Math.round(b.height)}; };
    const deck = document.querySelector('.player-zone .deck-shuffle-wrapper');
    const deckPile = document.querySelector('.player-zone .deck-pile');
    const center = document.querySelector('.center-zone');
    const slots = document.querySelectorAll('.player-zone .card-slot-wrapper');
    const lastSlot = slots[slots.length-1];
    const pot = document.querySelector('.pot-box');
    const msg = document.querySelector('.game-message');
    return { deck:r(deck), deckPile:r(deckPile), center:r(center), lastSlot:r(lastSlot), pot:r(pot), msg:r(msg), vw: window.innerWidth };
  });

  console.log(JSON.stringify(data, null, 2));

  const overlap = (a,b) => !a||!b ? null : !(a.right<=b.left || a.left>=b.right || a.bottom<=b.top || a.top>=b.bottom);
  console.log('deck∩center  :', overlap(data.deck, data.center));
  console.log('deck∩lastSlot:', overlap(data.deck, data.lastSlot));
  console.log('deck∩pot     :', overlap(data.deck, data.pot));
  console.log('deck∩msg     :', overlap(data.deck, data.msg));

  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
