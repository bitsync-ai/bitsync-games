"use client";

import { useEffect, useRef } from "react";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

export default function Home() {
  const gameHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let cancelled = false;

    async function boot() {
      const Phaser = await import("phaser");
      if (cancelled || !gameHost.current) return;

      class BattingScene extends Phaser.Scene {
        private phase: "ready" | "pitch" | "result" | "gameover" = "ready";
        private ball!: import("phaser").GameObjects.Rectangle;
        private bat!: import("phaser").GameObjects.Container;
        private pitcher!: import("phaser").GameObjects.Container;
        private message!: import("phaser").GameObjects.Text;
        private subMessage!: import("phaser").GameObjects.Text;
        private scoreText!: import("phaser").GameObjects.Text;
        private outsText!: import("phaser").GameObjects.Text;
        private streakText!: import("phaser").GameObjects.Text;
        private bestText!: import("phaser").GameObjects.Text;
        private timingBar!: import("phaser").GameObjects.Rectangle;
        private timingMarker!: import("phaser").GameObjects.Rectangle;
        private pitchTween?: import("phaser").Tweens.Tween;
        private score = 0;
        private outs = 0;
        private strikes = 0;
        private streak = 0;
        private best = 0;
        private canSwing = false;
        private pitchDuration = 1180;

        constructor() {
          super("batting");
        }

        create() {
          this.best = Number(localStorage.getItem("pixelSluggerBest") || 0);
          this.drawBallpark();
          this.pitcher = this.makePitcher(644, 272);
          this.bat = this.makeBatter(328, 358);
          this.ball = this.add
            .rectangle(641, 294, 8, 8, 0xfff4d6)
            .setStrokeStyle(2, 0x8f2738)
            .setDepth(20)
            .setVisible(false);

          this.makeHud();
          this.makeStartCard();

          this.input.on("pointerdown", () => this.press());
          this.input.keyboard?.on("keydown-SPACE", (event: KeyboardEvent) => {
            event.preventDefault();
            this.press();
          });
          this.input.keyboard?.on("keydown-ENTER", (event: KeyboardEvent) => {
            event.preventDefault();
            this.press();
          });
        }

        private drawBallpark() {
          this.cameras.main.setBackgroundColor("#10243b");
          const g = this.add.graphics();

          // Scoreboard sky and distant stands
          g.fillStyle(0x10243b).fillRect(0, 0, 960, 170);
          g.fillStyle(0x1b3852).fillRect(0, 116, 960, 66);
          for (let x = 10; x < 960; x += 18) {
            const colors = [0xf5c04a, 0xef6b52, 0x67b7a7, 0xe9e2c3];
            g.fillStyle(colors[(x / 18) % colors.length | 0]);
            g.fillRect(x, 130 + ((x / 18) % 3) * 10, 8, 8);
          }
          g.fillStyle(0x0a1728).fillRect(0, 166, 960, 20);
          g.fillStyle(0xf5c04a).fillRect(0, 166, 960, 4);

          // Outfield and mowing stripes
          g.fillStyle(0x2e7047).fillRect(0, 186, 960, 354);
          g.fillStyle(0x347d4e);
          for (let x = -180; x < 1100; x += 210) {
            g.fillTriangle(480, 226, x, 540, x + 105, 540);
          }

          // Infield dirt and diamond
          g.fillStyle(0xb97843);
          g.fillTriangle(480, 238, 760, 480, 200, 480);
          g.fillStyle(0xc98950);
          g.fillTriangle(480, 278, 664, 450, 296, 450);
          g.fillStyle(0x2e7047);
          g.fillTriangle(480, 305, 600, 430, 360, 430);

          // Chalk lines and bases
          g.lineStyle(4, 0xf7e9c7, 1);
          g.lineBetween(402, 470, 110, 540);
          g.lineBetween(558, 470, 850, 540);
          this.drawBase(g, 480, 421);
          this.drawBase(g, 586, 368);
          this.drawBase(g, 480, 318);
          this.drawBase(g, 374, 368);
          g.fillStyle(0xd8a169).fillEllipse(640, 295, 74, 32);

          // Foul poles
          g.fillStyle(0xf5c04a).fillRect(54, 100, 6, 155);
          g.fillStyle(0xf5c04a).fillRect(900, 100, 6, 155);
        }

        private drawBase(
          g: import("phaser").GameObjects.Graphics,
          x: number,
          y: number,
        ) {
          g.fillStyle(0xfff4d6);
          g.fillPoints(
            [
              new Phaser.Math.Vector2(x, y - 7),
              new Phaser.Math.Vector2(x + 9, y),
              new Phaser.Math.Vector2(x, y + 7),
              new Phaser.Math.Vector2(x - 9, y),
            ],
            true,
          );
        }

        private makePitcher(x: number, y: number) {
          const body = this.add.container(x, y).setDepth(10);
          const parts = [
            this.add.rectangle(0, -19, 18, 18, 0xd99562),
            this.add.rectangle(0, -32, 24, 8, 0x8f2738),
            this.add.rectangle(0, -4, 25, 27, 0xe9e2c3),
            this.add.rectangle(-8, 16, 8, 20, 0x10243b),
            this.add.rectangle(8, 16, 8, 20, 0x10243b),
            this.add.rectangle(-19, -5, 14, 8, 0xd99562),
            this.add.rectangle(19, -5, 14, 8, 0xd99562),
          ];
          body.add(parts);
          return body;
        }

        private makeBatter(x: number, y: number) {
          const body = this.add.container(x, y).setDepth(14);
          const shadow = this.add.ellipse(0, 39, 66, 14, 0x173927, 0.55);
          const backLeg = this.add.rectangle(-11, 22, 11, 34, 0xe9e2c3);
          const frontLeg = this.add.rectangle(12, 22, 11, 34, 0xe9e2c3);
          const torso = this.add.rectangle(0, -6, 36, 40, 0x8f2738);
          const head = this.add.rectangle(3, -40, 23, 23, 0xb97843);
          const helmet = this.add.rectangle(1, -51, 29, 10, 0x10243b);
          const arm = this.add.rectangle(17, -12, 30, 9, 0xb97843);
          const bat = this.add
            .rectangle(37, -32, 64, 7, 0xf5c04a)
            .setOrigin(0.12, 0.5)
            .setAngle(-62)
            .setName("bat");
          body.add([shadow, backLeg, frontLeg, torso, head, helmet, arm, bat]);
          return body;
        }

        private makeHud() {
          const labelStyle = {
            fontFamily: '"Courier New", monospace',
            fontSize: "20px",
            color: "#fff4d6",
            fontStyle: "bold",
          };
          this.scoreText = this.add.text(28, 22, "SCORE 00000", labelStyle);
          this.outsText = this.add.text(28, 52, "OUTS  ○ ○ ○", labelStyle);
          this.streakText = this.add
            .text(932, 22, "STREAK 0", labelStyle)
            .setOrigin(1, 0);
          this.bestText = this.add
            .text(932, 52, `BEST ${String(this.best).padStart(5, "0")}`, {
              ...labelStyle,
              color: "#f5c04a",
              fontSize: "16px",
            })
            .setOrigin(1, 0);

          this.add.rectangle(480, 508, 312, 12, 0x0a1728, 0.8);
          this.add.rectangle(480, 508, 86, 12, 0x67b7a7, 0.9);
          this.add.rectangle(480, 508, 28, 12, 0xf5c04a, 1);
          this.timingMarker = this.add.rectangle(614, 508, 6, 20, 0xfff4d6);
          this.timingBar = this.add.rectangle(480, 508, 312, 1, 0xffffff, 0);
          this.add
            .text(480, 526, "SWING WHEN THE MARKER HITS GOLD", {
              fontFamily: '"Courier New", monospace',
              fontSize: "11px",
              color: "#d5dccf",
            })
            .setOrigin(0.5);

          this.message = this.add
            .text(480, 102, "", {
              fontFamily: '"Courier New", monospace',
              fontSize: "38px",
              color: "#fff4d6",
              fontStyle: "bold",
              stroke: "#10243b",
              strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(40);
          this.subMessage = this.add
            .text(480, 143, "", {
              fontFamily: '"Courier New", monospace',
              fontSize: "15px",
              color: "#f5c04a",
              fontStyle: "bold",
              stroke: "#10243b",
              strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(40);
        }

        private makeStartCard() {
          const card = this.add.container(480, 270).setDepth(100);
          const panel = this.add
            .rectangle(0, 0, 560, 252, 0x0a1728, 0.96)
            .setStrokeStyle(6, 0xf5c04a);
          const eyebrow = this.add
            .text(0, -88, "BOTTOM OF THE 9TH", {
              fontFamily: '"Courier New", monospace',
              fontSize: "15px",
              color: "#67b7a7",
              fontStyle: "bold",
            })
            .setOrigin(0.5);
          const title = this.add
            .text(0, -43, "PIXEL SLUGGER", {
              fontFamily: '"Courier New", monospace',
              fontSize: "48px",
              color: "#fff4d6",
              fontStyle: "bold",
            })
            .setOrigin(0.5);
          const rule = this.add.rectangle(0, 7, 410, 3, 0x8f2738);
          const copy = this.add
            .text(
              0,
              47,
              "ONE BUTTON. THREE OUTS.\nTIME YOUR SWING AND CHASE THE HIGH SCORE.",
              {
                fontFamily: '"Courier New", monospace',
                fontSize: "15px",
                color: "#d5dccf",
                align: "center",
                lineSpacing: 9,
              },
            )
            .setOrigin(0.5);
          const prompt = this.add
            .text(0, 99, "PRESS SPACE OR TAP TO PLAY", {
              fontFamily: '"Courier New", monospace',
              fontSize: "17px",
              color: "#f5c04a",
              fontStyle: "bold",
            })
            .setOrigin(0.5);
          this.tweens.add({
            targets: prompt,
            alpha: 0.35,
            duration: 650,
            yoyo: true,
            repeat: -1,
          });
          card.add([panel, eyebrow, title, rule, copy, prompt]);
          card.setName("start-card");
        }

        private press() {
          if (this.phase === "ready") {
            this.children.getByName("start-card")?.destroy();
            this.beginPitch();
            return;
          }
          if (this.phase === "gameover") {
            this.scene.restart();
            return;
          }
          if (this.phase === "pitch" && this.canSwing) {
            this.swing();
          }
        }

        private beginPitch() {
          this.phase = "pitch";
          this.canSwing = false;
          this.message.setText("");
          this.subMessage.setText(
            this.strikes > 0 ? `${this.strikes} STRIKE${this.strikes > 1 ? "S" : ""}` : "",
          );
          this.ball.setPosition(641, 294).setScale(0.75).setVisible(true);
          this.timingMarker.x = 614;

          this.tweens.add({
            targets: this.pitcher,
            angle: -5,
            y: 266,
            duration: 180,
            yoyo: true,
            onComplete: () => {
              this.canSwing = true;
              this.pitchTween = this.tweens.add({
                targets: this.ball,
                x: 392,
                y: 383,
                scale: 1.45,
                duration: this.pitchDuration,
                ease: "Quad.easeIn",
                onComplete: () => this.takeStrike(),
              });
              this.tweens.add({
                targets: this.timingMarker,
                x: 444,
                duration: this.pitchDuration,
                ease: "Linear",
              });
            },
          });
        }

        private swing() {
          this.canSwing = false;
          this.pitchTween?.stop();
          this.tweens.killTweensOf(this.timingMarker);

          const batSprite = this.bat.getByName(
            "bat",
          ) as import("phaser").GameObjects.Rectangle;
          batSprite.setAngle(-62);
          this.tweens.add({
            targets: batSprite,
            angle: 26,
            duration: 105,
            yoyo: true,
            hold: 60,
          });

          // Derive timing from the visible meter so the game always plays
          // exactly the way it looks: right is early, left is late.
          const error = (480 - this.timingMarker.x) * (this.pitchDuration / 170);
          const absError = Math.abs(error);

          if (absError <= 175) {
            this.registerHit(absError, error);
          } else {
            this.ball.setVisible(false);
            this.resolveMiss(error < 0 ? "TOO EARLY!" : "TOO LATE!");
          }
        }

        private registerHit(absError: number, error: number) {
          this.phase = "result";
          this.streak += 1;
          let label = "SINGLE!";
          let points = 100;
          let color = "#fff4d6";
          let distance = 224;

          if (absError <= 42) {
            label = "HOME RUN!";
            points = 1000;
            color = "#f5c04a";
            distance = 420;
          } else if (absError <= 82) {
            label = "TRIPLE!";
            points = 500;
            color = "#ef6b52";
            distance = 350;
          } else if (absError <= 125) {
            label = "DOUBLE!";
            points = 250;
            color = "#67b7a7";
            distance = 285;
          }

          points += Math.max(0, (this.streak - 1) * 25);
          this.score += points;
          this.strikes = 0;
          this.updateHud();
          this.message.setColor(color).setText(label);
          this.subMessage.setText(`+${points}  •  ${error < 0 ? "PULLED" : "OPPOSITE FIELD"}`);

          const landingX = Phaser.Math.Clamp(
            480 + error * 1.15,
            96,
            864,
          );
          const landingY = 392 - distance * 0.55;
          this.tweens.add({
            targets: this.ball,
            x: landingX,
            y: landingY,
            scale: 0.45,
            angle: 720,
            duration: 760,
            ease: "Cubic.easeOut",
            onComplete: () => {
              this.ball.setVisible(false);
              this.time.delayedCall(900, () => this.beginPitch());
            },
          });
        }

        private takeStrike() {
          if (!this.canSwing) return;
          this.canSwing = false;
          this.ball.setVisible(false);
          this.resolveMiss("STRIKE!");
        }

        private resolveMiss(label: string) {
          this.phase = "result";
          this.streak = 0;
          this.strikes += 1;
          this.message.setColor("#ef6b52").setText(label);
          if (this.strikes >= 3) {
            this.strikes = 0;
            this.outs += 1;
            this.subMessage.setText("BATTER OUT");
          } else {
            this.subMessage.setText(
              `${this.strikes} STRIKE${this.strikes > 1 ? "S" : ""}`,
            );
          }
          this.updateHud();
          if (this.outs >= 3) {
            this.time.delayedCall(900, () => this.endGame());
          } else {
            this.time.delayedCall(900, () => this.beginPitch());
          }
        }

        private updateHud() {
          this.scoreText.setText(`SCORE ${String(this.score).padStart(5, "0")}`);
          this.streakText.setText(`STREAK ${this.streak}`);
          const marks = [0, 1, 2]
            .map((index) => (index < this.outs ? "●" : "○"))
            .join(" ");
          this.outsText.setText(`OUTS  ${marks}`);
        }

        private endGame() {
          this.phase = "gameover";
          const isRecord = this.score > this.best;
          if (isRecord) {
            this.best = this.score;
            localStorage.setItem("pixelSluggerBest", String(this.best));
          }
          this.bestText.setText(`BEST ${String(this.best).padStart(5, "0")}`);
          this.message
            .setColor(isRecord ? "#f5c04a" : "#fff4d6")
            .setText(isRecord ? "NEW HIGH SCORE!" : "GAME OVER");
          this.subMessage.setText(
            `FINAL SCORE ${this.score}  •  PRESS SPACE OR TAP TO REPLAY`,
          );
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: gameHost.current,
        backgroundColor: "#10243b",
        pixelArt: true,
        roundPixels: true,
        scene: BattingScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          antialias: false,
          pixelArt: true,
          roundPixels: true,
        },
      });
    }

    boot();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="game-page">
      <div className="arcade-shell">
        <header className="game-header">
          <div>
            <p className="kicker">ONE-BUTTON ARCADE</p>
            <h1>Pixel Slugger</h1>
          </div>
          <div className="control-chip" aria-label="Game controls">
            <span className="key">SPACE</span>
            <span>or tap to swing</span>
          </div>
        </header>

        <section className="cabinet" aria-label="Pixel Slugger baseball game">
          <div ref={gameHost} className="game-host" />
        </section>

        <footer className="game-footer">
          <span>Time the pitch.</span>
          <span>Protect the plate.</span>
          <span>Three outs to set your score.</span>
        </footer>
      </div>
    </main>
  );
}
