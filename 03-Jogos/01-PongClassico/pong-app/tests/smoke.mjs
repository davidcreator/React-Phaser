/**
 * Smoke test de browser: percorre o fluxo real do usuário e falha
 * se houver qualquer erro de página/console.
 */
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const errors = [];

function fail(msg) {
  errors.push(msg);
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--enable-unsafe-swiftshader',
  ],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', (e) => fail(`PAGEERROR: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') fail(`CONSOLE: ${m.text()}`);
});

try {
  // ── Tela inicial ──
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('.title-screen', { timeout: 8000 });
  await page.screenshot({ path: 'shots/01-title.png' });

  // ── Menu ──
  await page.click('text=COMEÇAR');
  await page.waitForSelector('.menu-screen', { timeout: 5000 });
  await page.click('.mode-card:has-text("Power-ups")');
  await page.click('[aria-label="Nível de dificuldade"] button:has-text("Médio")');
  await page.click('[aria-label="Quantidade de vidas"] button:has-text("3")');
  // Asserções de estado do menu (anti-regressão de seleção)
  const menuState = await page.evaluate(() => {
    const lives = document.querySelector('[aria-label="Quantidade de vidas"]');
    const activeLives = lives?.querySelector('button.active')?.textContent?.trim();
    const activeMode = document.querySelector('.mode-card.selected h3')?.textContent?.trim();
    const activeDiff = document.querySelector('[aria-label="Nível de dificuldade"] button.active')
      ?.textContent?.trim();
    return { activeLives, activeMode, activeDiff };
  });
  if (menuState.activeLives !== '3') fail(`vidas selecionadas = ${menuState.activeLives}, esperado 3`);
  if (menuState.activeMode !== 'Power-ups') fail(`modo selecionado = ${menuState.activeMode}`);
  if (!menuState.activeDiff?.startsWith('Médio')) fail(`nível selecionado = ${menuState.activeDiff}`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shots/02-menu.png' });

  // ── Controles ──
  await page.click('text=Configurar Controles');
  await page.waitForSelector('.controls-screen');
  await page.click('.controls-screen .seg button:has-text("W / S")');
  await page.keyboard.press('a'); // teste de entrada
  await page.waitForSelector('.key-test.active', { timeout: 3000 });
  await page.screenshot({ path: 'shots/03-controls.png' });
  await page.click('text=Concluir');
  await page.waitForSelector('.menu-screen');

  // ── Partida ──
  await page.click('text=INICIAR PARTIDA');
  await page.waitForSelector('.stage canvas', { timeout: 10000 });
  await page.waitForTimeout(2600); // saque + troca

  const canvasBox = await page.locator('.stage canvas').boundingBox();
  if (!canvasBox || canvasBox.width < 300) fail('canvas sem tamanho adequado');

  // Movimento do jogador
  await page.keyboard.down('s');
  await page.waitForTimeout(400);
  await page.keyboard.up('s');

  // Pausa/retomada via Esc
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=PAUSADO', { timeout: 3000 });
  await page.screenshot({ path: 'shots/04-pause.png' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=PAUSADO', { state: 'detached', timeout: 3000 });

  // Deixa jogar um pouco mais (power-ups podem spawnar)
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'shots/05-game.png' });

  // HUD presente e coerente
  const hud = (await page.textContent('.hud')) ?? '';
  if (!hud.includes('VOCÊ')) fail('HUD sem rótulo VOCÊ');
  if (!hud.includes('CPU')) fail('HUD sem rótulo CPU');
  if (!hud.includes('❤️')) fail('HUD sem vidas');
  const heartCount = await page.locator('.hud-side.left .heart').count();
  if (heartCount !== 3) fail(`corações no HUD = ${heartCount}, esperado 3 (vidas=3)`);

  // ── Reiniciar via pausa ──
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=PAUSADO');
  await page.click('text=Reiniciar partida');
  await page.waitForSelector('text=PAUSADO', { state: 'detached', timeout: 3000 });

  // ── Sair para menu ──
  await page.keyboard.press('Escape');
  await page.click('text=Sair para o menu');
  await page.waitForSelector('.menu-screen', { timeout: 5000 });

  // ── Ranking vazio ──
  await page.click('text=Ver Ranking');
  await page.waitForSelector('.ranking-screen');
  await page.waitForSelector('text=Nenhuma partida pontuada ainda', { timeout: 3000 });
  await page.screenshot({ path: 'shots/06-ranking.png' });
  await page.click('text=Voltar ao Menu');
  await page.waitForSelector('.menu-screen');

  // ── Título de novo ──
  await page.click('text=← Início');
  await page.waitForSelector('.title-screen');
} catch (e) {
  fail(`EXCEPTION: ${e.message}`);
}

await browser.close();

if (errors.length) {
  console.error('❌ smoke-test falhou:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log('✅ smoke-test: fluxo completo sem erros de runtime');
