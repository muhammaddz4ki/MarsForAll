#!/usr/bin/env node
/**
 * Fetch all WIUP polygons from KSP BIG Satu Peta ArcGIS REST service and
 * save as a standard GeoJSON file.
 *
 * Usage: node scripts/fetch-wiup.js
 * Output: apps/web/public/data/wiup.geojson
 *
 * Source: https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/
 *         PERIZINAN_DAN_PERTANAHAN/MapServer/4
 * The layer "Peta Wilayah Izin Usaha Pertambangan" is publicly accessible
 * without authentication from the Badan Informasi Geospasial (BIG) portal.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const BASE =
  "https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/PERIZINAN_DAN_PERTANAHAN/MapServer/4/query";
const OUT_PATH = path.join(
  __dirname,
  "..",
  "apps",
  "web",
  "public",
  "data",
  "wiup.geojson"
);
const PAGE_SIZE = 1000;

// The server returns at most 1000 features per request; we paginate with resultOffset.
function fetchPage(offset) {
  const url =
    `${BASE}?where=1=1&outFields=*&returnGeometry=true` +
    `&resultRecordCount=${PAGE_SIZE}&resultOffset=${offset}&f=geojson`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse error at offset ${offset}: ${e}`));
          }
        });
      })
      .on("error", reject);
  });
}

// Map raw field names -> cleaner property names used by the detail drawer.
function transformFeature(f) {
  const p = f.properties;

  // Derive permit type string (tiptmb field)
  const tiptmb = (p.tiptmb || "").toUpperCase();
  // Map to our internal wiupTypes keys
  const typeMap = {
    IUP: "iup",
    IUPK: "iupk",
    IPR: "ipr",
    "KONTRAK KARYA": "kk",
    KK: "kk",
    PKP2B: "pkp2b",
    WIUP: "wiup",
    WIUPK: "wiupk",
  };
  const type = typeMap[tiptmb] || tiptmb.toLowerCase() || "iup";

  // Derive commodity group
  const rawCommodity = (p.commdt || "").toUpperCase();
  let commodityGroup = "lainnya";
  if (rawCommodity.includes("BATUBARA")) commodityGroup = "batubara";
  else if (rawCommodity.includes("NIKEL")) commodityGroup = "nikel";
  else if (rawCommodity.includes("TIMAH")) commodityGroup = "timah";
  else if (rawCommodity.includes("EMAS")) commodityGroup = "emas";
  else if (rawCommodity.includes("BAUKSIT")) commodityGroup = "bauksit";
  else if (rawCommodity.includes("ANDESIT")) commodityGroup = "andesit";
  else if (rawCommodity.includes("SIRTU") || rawCommodity.includes("PASIR")) commodityGroup = "sirtu";

  // Epoch ms → ISO date string
  const toDate = (ms) =>
    ms && ms > 0 ? new Date(ms).toISOString().slice(0, 10) : null;

  return {
    type: "Feature",
    geometry: f.geometry,
    properties: {
      // used by the filter system
      type,
      commodityGroup,
      // display fields in the detail drawer
      name: p.nmoprt || "-",
      companyType: p.tipopr || "-",
      permitType: p.tiptmb || "-",
      permitNumber: p.skblok || "-",
      commodity: p.commdt || "-",
      areaHa: p.lublok || 0,
      province: p.prov || "-",
      district: p.kab || "-",
      island: p.island || "-",
      location: p.locate || "-",
      issuer: p.issuer || "-",
      address: p.adoprt || "-",
      phone: p.phoprt || "-",
      status: p.status || "-",
      dateStart: toDate(p.datstr),
      dateEnd: toDate(p.datend),
      dateCreated: toDate(p.datcrte),
      blockId: p.idblok || "-",
      remark: p.remark || "-",
    },
  };
}

async function main() {
  console.log("Fetching WIUP data from KSP BIG Satu Peta…");
  const features = [];
  let offset = 0;

  for (;;) {
    process.stdout.write(`  offset=${offset}… `);
    const page = await fetchPage(offset);

    if (!page.features || page.features.length === 0) {
      console.log("done.");
      break;
    }

    for (const f of page.features) {
      if (f.geometry) features.push(transformFeature(f));
    }

    console.log(`${page.features.length} rows (total ${features.length})`);

    if (page.features.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
    // Be polite to the server
    await new Promise((r) => setTimeout(r, 300));
  }

  const geojson = {
    type: "FeatureCollection",
    name: "wiup",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(geojson));
  const kb = Math.round(fs.statSync(OUT_PATH).size / 1024);
  console.log(`\n✅  Saved ${features.length} features → ${OUT_PATH} (${kb} KB)`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
