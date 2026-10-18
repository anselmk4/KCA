/**
 * Ansella — enregistrement automatique d'une vidéo de démo marketing.
 *
 * Usage :
 *   node record-demo.mjs                 → format bureau 1280x800
 *   node record-demo.mjs --mobile        → format vertical 9:16 (TikTok / Reels)
 *   BASE_URL=http://localhost:3000 node record-demo.mjs
 *
 * Le parcours ne visite que des pages publiques : aucune connexion,
 * aucune saisie de données, aucun achat.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const BASE_URL = (process.env.BASE_URL || "https://ansella.app").replace(/\/$/, "");
const MOBILE = process.argv.includes("--mobile");
const VIEWPORT = MOBILE ? { width: 405, height: 720 } : { width: 1280, height: 800 };
const VIDEO_SIZE = MOBILE ? { width: 1080, height: 1920 } : { width: 1280, height: 800 };
const OUT_DIR = path.resolve("output");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Curseur visible + halo au clic, pour que les interactions se voient dans la vidéo. */
const CURSOR_SCRIPT = `
(() => {
  if (window.__ansellaCursor) return;
  window.__ansellaCursor = true;
  const install = () => {
    const c = document.createElement("div");
    c.id = "__ansella_cursor";
    Object.assign(c.style, {
      position: "fixed", top: "0", left: "0", width: "22px", height: "22px",
      borderRadius: "50%", background: "rgba(20,184,166,0.35)",
      border: "2px solid rgba(13,148,136,0.95)", pointerEvents: "none",
      zIndex: "2147483647", transform: "translate(-50%,-50%)",
      transition: "width .15s, height .15s, background .15s",
      boxShadow: "0 0 12px rgba(20,184,166,.6)"
    });
    document.body.appendChild(c);
    document.addEventListener("mousemove", (e) => {
      c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px";
    }, true);
    document.addEventListener("mousedown", () => {
      c.style.width = "34px"; c.style.height = "34px"; c.style.background = "rgba(20,184,166,.6)";
    }, true);
    document.addEventListener("mouseup", () => {
      c.style.width = "22px"; c.style.height = "22px"; c.style.background = "rgba(20,184,166,.35)";
    }, true);
  };
  if (document.body) install(); else document.addEventListener("DOMContentLoaded", install);
})();
`;

async function goto(page, route, label) {
  const url = `${BASE_URL}${route}`;
  console.log(`→ ${label} (${url})`);
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    if (res && res.status() >= 400) {
      console.warn(`  ⚠ ${label} : HTTP ${res.status()}, étape ignorée`);
      return false;
    }
    await dismissOverlays(page);
    await sleep(2500);
    return true;
  } catch (err) {
    console.warn(`  ⚠ ${label} inaccessible : ${err.message}`);
    return false;
  }
}

/** Ferme bannières cookies / popups éventuels. */
async function dismissOverlays(page) {
  const candidates = [
    /accepter/i, /tout accepter/i, /accept/i, /j'ai compris/i, /ok/i,
  ];
  for (const name of candidates) {
    const btn = page.getByRole("button", { name }).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      const text = (await btn.innerText().catch(() => "")).trim();
      // Ne jamais cliquer sur un bouton d'achat par erreur.
      if (/achet|pay|buy/i.test(text)) continue;
      await btn.click().catch(() => {});
      await sleep(600);
      return;
    }
  }
}

/** Défilement fluide par petits pas jusqu'en bas (ou maxSteps). */
async function smoothScroll(page, { step = 90, delay = 28, pauseEvery = 650, pause = 1600, maxPx = 9000 } = {}) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const target = Math.min(total, maxPx);
  let scrolled = 0;
  let sincePause = 0;
  while (scrolled < target) {
    await page.mouse.wheel(0, step);
    scrolled += step;
    sincePause += step;
    await sleep(delay);
    if (sincePause >= pauseEvery) {
      sincePause = 0;
      await sleep(pause);
    }
  }
  await sleep(1200);
}

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1800);
}

async function moveAndClick(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(700);
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
    await sleep(500);
  }
  await locator.click();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, args: ["--hide-scrollbars"] });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: MOBILE ? 2.666 : 1,
    isMobile: MOBILE,
    hasTouch: MOBILE,
    locale: "fr-FR",
    colorScheme: "light",
    recordVideo: { dir: OUT_DIR, size: VIDEO_SIZE },
  });
  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();
  const visited = [];

  try {
    // 1. Accueil
    if (await goto(page, "/", "Accueil")) {
      await sleep(1500);
      await smoothScroll(page);
      await scrollToTop(page);
      visited.push("/");
    }

    // 2. Catalogue des formations
    if (await goto(page, "/courses", "Catalogue des formations")) {
      await smoothScroll(page, { maxPx: 2400 });
      visited.push("/courses");

      // 3. Fiche d'un cours
      const courseLink = page.locator('a[href^="/courses/"]').first();
      if (await courseLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await scrollToTop(page);
        await moveAndClick(page, courseLink);
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await sleep(3000);
        await smoothScroll(page, { maxPx: 4500 });
        visited.push(page.url().replace(BASE_URL, ""));
      }
    }

    // 4. Boutique e-books / produits digitaux
    if (await goto(page, "/store", "Boutique e-books")) {
      await smoothScroll(page, { maxPx: 1600 });
      visited.push("/store");

      const preview = page.getByRole("button", { name: /aperçu/i }).first();
      if (await preview.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moveAndClick(page, preview);
        await sleep(2000);
        // Faire défiler le contenu du modal puis montrer le bouton d'achat
        await page.mouse.wheel(0, 300);
        await sleep(1500);
        const cta = page.getByRole("button", { name: /acheter & télécharger/i }).first();
        if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
          const box = await cta.boundingBox();
          if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
        }
        await sleep(3500);
        const close = page.getByRole("button", { name: /^fermer$/i }).first();
        if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moveAndClick(page, close);
        } else {
          await page.keyboard.press("Escape");
        }
        await sleep(1500);
      }
    }

    // 5. Tarifs
    if (await goto(page, "/pricing", "Tarifs")) {
      await smoothScroll(page, { maxPx: 3500 });
      visited.push("/pricing");
    }

    // 6. Fonctionnalités
    if (await goto(page, "/features", "Fonctionnalités")) {
      await smoothScroll(page, { maxPx: 4000 });
      visited.push("/features");
    }

    // 7. Plan de clôture
    if (await goto(page, "/", "Retour accueil")) {
      await sleep(3500);
    }
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const raw = await video.path();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const base = `ansella-demo-${MOBILE ? "mobile" : "desktop"}-${stamp}`;
      const webm = path.join(OUT_DIR, `${base}.webm`);
      fs.renameSync(raw, webm);
      console.log(`\n✅ Vidéo enregistrée : ${webm}`);

      // Conversion MP4 automatique si ffmpeg est installé
      try {
        execSync("ffmpeg -version", { stdio: "ignore" });
        const mp4 = path.join(OUT_DIR, `${base}.mp4`);
        execSync(
          `ffmpeg -y -i "${webm}" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "${mp4}"`,
          { stdio: "ignore" }
        );
        console.log(`✅ Version MP4 : ${mp4}`);
      } catch {
        console.log("ℹ ffmpeg non détecté : seule la version .webm a été générée.");
      }
    }
    console.log(`Pages visitées : ${visited.join(", ") || "aucune"}`);
  }
}

main().catch((err) => {
  console.error("❌ Échec de l'enregistrement :", err);
  process.exit(1);
});
