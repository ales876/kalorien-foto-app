// App-Icons ohne externe Abhaengigkeiten.
// Motiv: der Kalorien-Fortschrittsring der App — teilgefuellt, mit
// runden Enden, auf gelbem Grund.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
};
const png = (w, h, rgba) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++)
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
/** Weiche Kante: Abstand zur Sollkante in Deckung umrechnen. */
const cover = (d) => clamp01(0.5 - d);

const GELB = [255, 212, 0];
// Pastell-Flieder fuer den gefuellten Teil des Rings.
const FLIEDER = [196, 167, 231];
const PROGRESS = 0.72; // Anteil des gefuellten Rings

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const corner = size * 0.225; // iOS-artige Rundung
  const R = size * 0.295; // Ringradius
  const w = size * 0.082; // halbe Ringstaerke
  const endAngle = PROGRESS * Math.PI * 2;

  // Endpunkte fuer die runden Abschluesse
  const capAt = (a) => [c + R * Math.sin(a), c - R * Math.cos(a)];
  const [cap1x, cap1y] = capAt(0);
  const [cap2x, cap2y] = capAt(endAngle);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const px = x + 0.5,
        py = y + 0.5;

      // Abgerundetes Quadrat
      const dx = Math.abs(px - c) - (c - corner);
      const dy = Math.abs(py - c) - (c - corner);
      const outside =
        Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
        Math.min(Math.max(dx, dy), 0) -
        corner;
      const bg = cover(outside);

      // Ringband
      const dist = Math.hypot(px - c, py - c);
      const band = cover(Math.abs(dist - R) - w);

      // Winkel ab oben im Uhrzeigersinn
      let a = Math.atan2(px - c, c - py);
      if (a < 0) a += Math.PI * 2;

      // Gefuellter Bogen inklusive runder Enden
      let arc = a <= endAngle ? band : 0;
      for (const [cx, cy] of [
        [cap1x, cap1y],
        [cap2x, cap2y],
      ]) {
        arc = Math.max(arc, cover(Math.hypot(px - cx, py - cy) - w));
      }
      // Restliche Bahn als helle Spur — dunkel angedeutet wirkte
      // auf dem Gelb schmutzig.
      const track = Math.max(0, band - arc) * 0.5;

      const ink = clamp01(arc) * bg;
      const hell = clamp01(track) * bg * (1 - ink);
      for (let k = 0; k < 3; k++) {
        const grund = GELB[k] * (1 - hell) + 255 * hell;
        rgba[i + k] = Math.round(grund * (1 - ink) + FLIEDER[k] * ink);
      }
      rgba[i + 3] = Math.round(bg * 255);
    }
  }
  return png(size, size, rgba);
}

const ziel = process.argv[2];
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  writeFileSync(`${ziel}/${name}`, render(size));
  console.log("geschrieben:", name);
}
