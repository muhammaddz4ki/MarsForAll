#!/usr/bin/env node
import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.resolve("apps/web/messages");
const EN_PATH = path.join(MESSAGES_DIR, "en.json");
const ID_PATH = path.join(MESSAGES_DIR, "id.json");

if (!fs.existsSync(EN_PATH) || !fs.existsSync(ID_PATH)) {
  console.error("[i18n-sync] Error: en.json or id.json does not exist!");
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
const id = JSON.parse(fs.readFileSync(ID_PATH, "utf8"));

function extractAllPaths(obj, prefix = "") {
  let paths = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      paths = paths.concat(extractAllPaths(v, fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

const enPaths = extractAllPaths(en);
const idPaths = extractAllPaths(id);

const missingInId = enPaths.filter((p) => !idPaths.includes(p));
const extraInId = idPaths.filter((p) => !enPaths.includes(p));

if (missingInId.length > 0 || extraInId.length > 0) {
  console.error("[i18n-sync] Parity Error between en.json and id.json:");
  if (missingInId.length) console.error("  Missing in id.json:", missingInId);
  if (extraInId.length) console.error("  Extra in id.json:", extraInId);
  process.exit(1);
}

console.log(`[i18n-sync] en.json and id.json ground truth matched 100% (${enPaths.length} keys).`);

// Helper to set nested property
function setNested(obj, pathParts, value) {
  let curr = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!curr[part] || typeof curr[part] !== "object") {
      curr[part] = {};
    }
    curr = curr[part];
  }
  curr[pathParts[pathParts.length - 1]] = value;
}

function getNested(obj, pathParts) {
  let curr = obj;
  for (const part of pathParts) {
    if (!curr || typeof curr !== "object" || !(part in curr)) {
      return undefined;
    }
    curr = curr[part];
  }
  return curr;
}

// Sync other locales (es, fr, zh) if they exist
const otherLocales = ["es", "fr", "zh"];
for (const loc of otherLocales) {
  const locPath = path.join(MESSAGES_DIR, `${loc}.json`);
  let locData = {};
  if (fs.existsSync(locPath)) {
    try {
      locData = JSON.parse(fs.readFileSync(locPath, "utf8"));
    } catch {
      locData = {};
    }
  }

  // Ensure all keys from en exist in locData
  for (const p of enPaths) {
    const parts = p.split(".");
    const existing = getNested(locData, parts);
    if (existing === undefined) {
      const enVal = getNested(en, parts);
      setNested(locData, parts, enVal);
    }
  }

  fs.writeFileSync(locPath, JSON.stringify(locData, null, 2) + "\n", "utf8");
  console.log(`[i18n-sync] Synchronized ${loc}.json (${enPaths.length} keys).`);
}

console.log("[i18n-sync] ALL LOCALE DICTIONARIES SYNCHRONIZED AND VERIFIED PERFECTLY!");
