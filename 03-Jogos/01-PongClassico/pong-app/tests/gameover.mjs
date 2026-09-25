/**
 * E2E do fluxo completo: partida → gol → game over → salvar ranking.
 * Vidas=1 para encerrar a partida no primeiro gol contra o jogador
 * (P1 fica imóvel no canto inferior, garantindo a concessão).
 */
import { chromium } from 'playwright-core';

const errors = [];
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
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`);
});

try {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.click('text=COMEÇAR');
  await page.waitForSelector('.menu-screen');

  // Vidas=1 + nível Difícil (bola rápida → decisão rápida)
  await page.click('[aria-label="Quantidade de vidas"] button:has-text("1")');
  await page.click('[aria-label="Nível de dificuldade"] button:has-text("Difícil")');
  await page.click('text=INICIAR PARTIDA');
  await page.waitForSelector('.stage canvas', { timeout: 10000 });

  // P1 para o canto inferior → não alcança a bola → concede o gol
  await page.keyboard.down('s');
  await page.waitForTimeout(1200);
  await page.keyboard.up('s');

  console.log('aguardando fim de partida (vidas=1)…');
  await page.waitForSelector('.gameover-card', { timeout: 90000 });
  console.log('✓ game over exibido');

  const goText = (await page.textContent('.gameover-card')) ?? '';
  for (const need of ['Pontuação', 'Gols', 'Rallys', 'Tempo', 'Salvar no ranking']) {
    if (!goText.includes(need)) errors.push(`game over sem "${need}"`);
  }
  await page.screenshot({ path: 'shots/07-gameover.png' });

  // Salvar no ranking
  await page.fill('.name-input', 'TESTADOR E2E');
  await page.click('text=Salvar no ranking');
  await page.waitForSelector('.saved-msg', { timeout: 5000 });
  const saved = (await page.textContent('.saved-msg')) ?? '';
  if (!saved.includes('#1')) errors.push(`mensagem de save inesperada: ${saved}`);
  await page.screenshot({ path: 'shots/08-saved.png' });

  // Ver ranking → entrada persistida
  await page.click('text=Ver ranking');
  await page.waitForSelector('.ranking-screen', { timeout: 5000 });
  await page.waitForSelector('text=TESTADOR E2E', { timeout: 5000 });
  await page.screenshot({ path: 'shots/09-ranking-full.png' });
  console.log('✓ ranking persistido');

  // Recarrega a página → ranking sobrevive (localStorage)
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('text=COMEÇAR');
  await page.click('text=Ver Ranking');
  await page.waitForSelector('text=TESTADOR E2E', { timeout: 5000 });
  console.log('✓ ranking sobrevive ao reload');
} catch (e) {
  errors.push(`EXCEPTION: ${e.message}`);
}

await browser.close();
if (errors.length) {
  console.error('❌ gameover-test falhou:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log('✅ gameover-test: partida → game over → ranking completo');
