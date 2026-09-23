import type { ProjectConfig } from "../types";

function download(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportConfigJson(config: ProjectConfig) {
  // strip the heavy dataUrl from meta for a lighter config (keep frame info)
  const clone: ProjectConfig = JSON.parse(JSON.stringify(config));
  if (clone.meta) {
    clone.meta.dataUrl = "<REPLACE_WITH_YOUR_SPRITESHEET_PATH>";
  }
  download("spritelab-config.json", JSON.stringify(clone, null, 2), "application/json");
}

export function exportFullProject(config: ProjectConfig) {
  // Projeto completo (inclui o dataUrl para reimportar depois)
  download(
    "spritelab-project.json",
    JSON.stringify(config, null, 2),
    "application/json"
  );
}

export function importProject(file: File): Promise<ProjectConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        resolve(parsed as ProjectConfig);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function exportSpriteSheetImage(config: ProjectConfig) {
  if (!config.meta) return;
  const a = document.createElement("a");
  a.href = config.meta.dataUrl;
  a.download = config.meta.fileName || "spritesheet.png";
  a.click();
}

export function exportPhaserComponent(config: ProjectConfig) {
  const meta = config.meta;
  const anims = config.animations
    .map(
      (a) => `      this.anims.create({
        key: ${JSON.stringify(a.name)},
        frames: this.anims.generateFrameNumbers(TEX, { start: ${a.startFrame}, end: ${a.endFrame} }),
        frameRate: ${a.frameRate},
        repeat: ${a.repeat},
        yoyo: ${a.yoyo},
      });`
    )
    .join("\n");

  const map = config.animMapping;
  const nameOf = (id: string | null | undefined) => {
    const found = config.animations.find((a) => a.id === id);
    return found ? JSON.stringify(found.name) : "null";
  };

  const code = `import { useEffect, useRef } from "react";
import Phaser from "phaser";

// ===================================================================
// Auto-gerado por SpriteLab. Coloque seu spritesheet em /public e
// aponte SHEET_URL para ele. Frame: ${meta ? meta.frameWidth + "x" + meta.frameHeight : "??"}
// ===================================================================

const SHEET_URL = "/spritesheet.png"; // <-- ajuste o caminho
const TEX = "player";

const FRAME = { width: ${meta?.frameWidth ?? 32}, height: ${meta?.frameHeight ?? 32} };

const ANIM_MAP = {
  idle: ${nameOf(map.idle)},
  walk: ${nameOf(map.walk)},
  jump: ${nameOf(map.jump)},
  action: ${nameOf(map.action)},
};

const CHARACTER = ${JSON.stringify(config.character, null, 2)};

class PlayerScene extends Phaser.Scene {
  constructor() { super("PlayerScene"); }

  preload() {
    this.load.spritesheet(TEX, SHEET_URL, FRAME);
  }

  create() {
${anims}

    this.player = this.add.sprite(400, 300, TEX, 0).setScale(CHARACTER.scale);
    this.physics.add.existing(this.player);
    this.body = this.player.body;
    this.body.setCollideWorldBounds(true);
    ${config.character.movementMode === "platformer" ? "this.body.setGravityY(CHARACTER.gravity);" : "this.body.setAllowGravity(false);"}
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyJump = this.input.keyboard.addKey("SPACE");
    this.keyAction = this.input.keyboard.addKey("J");
    if (ANIM_MAP.idle) this.player.play(ANIM_MAP.idle);
  }

  play(name) {
    if (name && this.anims.exists(name) && this.current !== name) {
      this.player.play(name, true);
      this.current = name;
    }
  }

  update() {
    const b = this.body;
    let moving = false;
    ${
      config.character.movementMode === "platformer"
        ? `b.setVelocityX(0);
    if (this.cursors.left.isDown) { b.setVelocityX(-CHARACTER.speed); this.player.setFlipX(true); moving = true; }
    else if (this.cursors.right.isDown) { b.setVelocityX(CHARACTER.speed); this.player.setFlipX(false); moving = true; }
    const onGround = b.blocked.down || b.touching.down;
    if (Phaser.Input.Keyboard.JustDown(this.keyJump) && onGround) b.setVelocityY(-CHARACTER.jumpPower);
    if (!onGround) this.play(ANIM_MAP.jump);
    else if (moving) this.play(ANIM_MAP.walk);
    else this.play(ANIM_MAP.idle);`
        : `b.setVelocity(0);
    if (this.cursors.left.isDown) { b.setVelocityX(-CHARACTER.speed); this.player.setFlipX(true); moving = true; }
    if (this.cursors.right.isDown) { b.setVelocityX(CHARACTER.speed); this.player.setFlipX(false); moving = true; }
    if (this.cursors.up.isDown) { b.setVelocityY(-CHARACTER.speed); moving = true; }
    if (this.cursors.down.isDown) { b.setVelocityY(CHARACTER.speed); moving = true; }
    if (moving) this.play(ANIM_MAP.walk); else this.play(ANIM_MAP.idle);`
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyAction)) this.play(ANIM_MAP.action);
  }
}

export default function PhaserSprite() {
  const ref = useRef(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ref.current,
      width: 800,
      height: 600,
      pixelArt: true,
      backgroundColor: ${JSON.stringify(config.stage.bgColor)},
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
      scene: [PlayerScene],
    });
    return () => game.destroy(true);
  }, []);
  return <div ref={ref} />;
}
`;
  download("PhaserSprite.tsx", code, "text/plain");
}
