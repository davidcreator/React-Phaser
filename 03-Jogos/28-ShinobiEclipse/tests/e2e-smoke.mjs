/**
 * Smoke test E2E — Shinobi Eclipse
 * =================================
 * Valida o caminho crítico do jogo contra um build de produção:
 *   1. Boot da cena Phaser + canvas visível
 *   2. Estado inicial coerente (spawn, 8 inimigos na Área 01)
 *   3. Movimentação do player (input de teclado chega à física)
 *   4. Combate: dano ao inimigo via espada
 *   5. Pausa/retomada (ESC + comando) sem travar o loop
 *   6. Controles virtuais de toque não lançam exceção
 *   7. Zero erros de runtime no console
 *
 * Uso:
 *   npm run build && npm run preview &   # ou dev server
 *   npm run test:e2e                     # BASE_URL via env, default :4173
 *
 * Requer: npx playwright install chromium
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:4173";
const failures = [];

const check = (name, ok, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });

await page.goto(BASE, { waitUntil: "networkidle" });
check("menu carrega", (await page.locator("#game-title").count()) === 1);

await page.keyboard.press("Enter");
await page.waitForSelector(".phaser-host canvas", { timeout: 20000 });
check("canvas do Phaser monta", true);
await page.waitForTimeout(1500);

const initial = await page.evaluate(() => {
  const s = window.__shadowScene;
  return s ? { level: s.level, enemies: s.enemies.getChildren().length, px: Math.round(s.player.x), health: s.health } : null;
});
check("cena ativa com estado inicial", initial?.level === 1 && initial?.enemies === 8 && initial?.health === 100, JSON.stringify(initial));

// Movimentação: segurar D deve deslocar o player para a direita.
// Inimigos são congelados (body off) para isolar o teste de input —
// o crimson do spawn persegue e derruba o player em <1s de teste.
await page.evaluate(() => {
  window.__shadowScene.enemies.getChildren().forEach((e) => {
    e.setVelocity(0, 0);
    e.body.enable = false;
  });
});
const x0 = initial.px;
await page.keyboard.down("KeyD");
await page.waitForTimeout(300);
// Em headless (SwiftShader ~10fps + fixedStep do Arcade) o deslocamento por
// segundo é reduzido; o sinal correto de input é a VELOCIDADE aplicada.
const mid = await page.evaluate(() => {
  const s = window.__shadowScene;
  return { vx: Math.round(s.player.body.velocity.x), d: s.keys.D.isDown };
});
await page.waitForTimeout(700);
await page.keyboard.up("KeyD");
const x1 = await page.evaluate(() => Math.round(window.__shadowScene.player.x));
check(
  "player se move com teclado",
  mid.d === true && mid.vx > 200 && x1 > x0 + 20,
  `vx=${mid.vx} | x ${x0} -> ${x1}`,
);

// Combate: teleporta ao lado de um inimigo e golpeia com a espada
const combat = await page.evaluate(async () => {
  const s = window.__shadowScene;
  const enemy = s.enemies.getChildren().find((e) => !e.dead);
  if (!enemy) return { ok: false };
  s.player.setPosition(enemy.x - 50, enemy.y);
  s.player.setVelocity(0, 0);
  const hpBefore = enemy.hp;
  s.swordAttack(s.time.now + 10_000);
  await new Promise((resolve) => setTimeout(resolve, 120));
  return { ok: enemy.hp < hpBefore || enemy.dead, hpBefore, hpAfter: enemy.hp };
});
check("espada causa dano", combat.ok === true, `hp ${combat.hpBefore} -> ${combat.hpAfter}`);

// Pausa e retomada
await page.keyboard.press("Escape");
await page.waitForTimeout(350);
const pausedState = await page.evaluate(() => ({ paused: window.__shadowScene.paused, modal: document.querySelector(".result-modal") !== null }));
check("ESC pausa com modal", pausedState.paused === true && pausedState.modal === true);
await page.keyboard.press("Escape");
await page.waitForTimeout(350);
const resumedState = await page.evaluate(() => window.__shadowScene.paused);
check("ESC retoma o jogo", resumedState === false);

// Controles virtuais: pointerdown/up sem exceção
await page.locator('.movement-controls button[aria-label="Mover para a esquerda"]').dispatchEvent("pointerdown");
await page.waitForTimeout(250);
await page.locator('.movement-controls button[aria-label="Mover para a esquerda"]').dispatchEvent("pointerup");
check("controle virtual sem crash", true);

// ===== Seleção de áreas: rank, pontuação e progresso =====
// Percorre a campanha (6 áreas) limpando cada uma — valida cadeia de transições.
const seenLevels = [];
let victory = false;
for (let loop = 0; loop < 8; loop++) {
  await page.evaluate(() => {
    const s = window.__shadowScene;
    s.enemies.getChildren().filter((e) => !e.dead).forEach((e) => s.damageEnemy(e, 99999, s.player.x));
  });
  await page.waitForTimeout(2900); // transição (650ms) + remontagem da cena
  const st = await page.evaluate(() => ({
    level: window.__shadowScene?.level ?? -1,
    enemies: window.__shadowScene?.enemies?.getChildren().length ?? -1,
    modal: document.querySelector(".result-modal h2")?.textContent ?? null,
  })).catch(() => ({ level: -1, enemies: -1, modal: "?" }));
  seenLevels.push(st.level);
  if (st.modal === "MISSAO CUMPRIDA") { victory = true; break; }
}
check("campanha de 6 áreas até a vitória", victory, `níveis visitados: ${[...new Set(seenLevels)].join(",")}`);
const finalLevel = seenLevels[seenLevels.length - 1] ?? 0;
check("vitória apenas na área final", finalLevel === 6, `última=${finalLevel}`);

const victoryRank = await page.locator(".result-rank .rank-badge").textContent().catch(() => null);
const victoryPts = await page.locator(".result-rank-score b").textContent().catch(() => null);
check("modal de vitória exibe rank e pontos", Boolean(victoryRank) && Boolean(victoryPts), `rank=${victoryRank} pts=${victoryPts}`);

const progressAll = await page.evaluate(() => JSON.parse(window.localStorage.getItem("shinobi-eclipse-progress") ?? "{}"));
const completedKeys = Object.keys(progressAll).filter((k) => progressAll[k]?.completed);
check("área 01 registrada com rank e pontuação", Boolean(progressAll["1"]?.completed) && progressAll["1"].bestScore > 0 && ["S", "A", "B", "C", "D"].includes(progressAll["1"].bestRank), JSON.stringify(progressAll["1"]));
check("todas as 6 áreas registradas", completedKeys.length === 6, `chaves: ${completedKeys.sort().join(",")}`);

// Volta ao menu e abre a tela de áreas
await page.locator('.result-modal button:has-text("VOLTAR AO MENU")').click();
await page.waitForTimeout(600);
await page.locator('.menu-actions button:has-text("AREAS")').click();
await page.waitForTimeout(600);
const cardCount = await page.locator(".level-card").count();
check("seleção exibe 6 áreas", cardCount === 6, `cards=${cardCount}`);
const card1 = await page.locator(".level-card").first().innerText();
const card6 = await page.locator(".level-card").nth(5).innerText();
check("seleção mostra área 01 CONCLUIDA", card1.includes("CONCLUIDA") && !card1.includes("BLOQUEADA"), card1.split("\n").slice(0, 3).join(" | "));
check("área 06 concluída e desbloqueada", card6.includes("CONCLUIDA") && !card6.includes("BLOQUEADA"), card6.split("\n").slice(0, 3).join(" | "));
check("todas rejogáveis pela seleção", await page.locator('.level-card button:has-text("REJOGAR AREA")').count() === 6);

await page.waitForTimeout(400);
const runtimeErrors = errors.filter((e) => !e.includes("GPU stall"));
check("zero erros de runtime", runtimeErrors.length === 0, runtimeErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(failures.length === 0 ? "\nTODOS OS CHECKS PASSARAM ✓" : `\nFALHOU: ${failures.join(", ")}`);
process.exit(failures.length === 0 ? 0 : 1);
