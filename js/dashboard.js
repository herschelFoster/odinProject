document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".gridcontainer > div");

  cards.forEach(card => {
    const img = card.querySelector("img");
    if (!img) return;
    if (!img.src) return; // skip empty src

    const applyColor = () => {
      try {
        // ✅ per-image override
        if (img.dataset.accent) {
          card.style.borderLeftColor = img.dataset.accent;
          return;
        }

        const color = sampleImageColor(img);
        if (color) {
          card.style.borderLeftColor = color; // override only the color
        }
      } catch (err) {
        console.warn("Could not sample image color:", err);
      }
    };

    if (img.complete && img.naturalWidth !== 0) {
      applyColor();
    } else {
      img.addEventListener("load", applyColor);
    }
  });
});


function sampleImageColor(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const w = canvas.width = 40;
  const h = canvas.height = 40;

  ctx.drawImage(img, 0, 0, w, h);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    // CORS / tainted canvas → neutral fallback
    return "rgba(255, 0, 0, 1)";
  }

  const buckets = Object.create(null); // "rq,gq,bq" -> {count, r, g, b}
  const bucketSize = 32;               // 0–255 → 0–7 for each channel

  let totalUsed = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 200) continue; // skip transparent pixels

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const rq = Math.floor(r / bucketSize);
    const gq = Math.floor(g / bucketSize);
    const bq = Math.floor(b / bucketSize);
    const key = `${rq},${gq},${bq}`;

    if (!buckets[key]) {
      buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
    }

    const bucket = buckets[key];
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    totalUsed++;
  }

  if (!totalUsed) {
    return "rgb(150, 150, 150)";
  }

  // Ignore teeny tiny colour blobs (like a small logo or single orange tree)
  const minCount = Math.max(3, Math.floor(totalUsed * 0.02)); // at least 2% of pixels

  let bestBucket = null;
  let bestCount = 0;

  for (const key in buckets) {
    const bucket = buckets[key];
    if (bucket.count < minCount) continue; // too small, skip

    if (bucket.count > bestCount) {
      bestCount = bucket.count;
      bestBucket = bucket;
    }
  }

  // If everything was tiny blobs (unlikely), fall back to the overall biggest bucket
  if (!bestBucket) {
    for (const key in buckets) {
      const bucket = buckets[key];
      if (bucket.count > bestCount) {
        bestCount = bucket.count;
        bestBucket = bucket;
      }
    }
  }

  if (!bestBucket) return "rgb(150, 150, 150)";

  const avgR = Math.round(bestBucket.r / bestBucket.count);
  const avgG = Math.round(bestBucket.g / bestBucket.count);
  const avgB = Math.round(bestBucket.b / bestBucket.count);

  // Turn that into a nice UI colour
  return softenColor(avgR, avgG, avgB);
}


function softenColor(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);

  // Pick a pleasant saturation: at least 0.4, at most 0.8
  let sat = s * 0.9;        // lean slightly more saturated than source
  if (sat < 0.4) sat = 0.4;
  if (sat > 0.8) sat = 0.8;

  // Force a mid–light value so it's never near-black or near-white
  const light = 0.4;        // try 0.45–0.55 range if you want slightly darker/lighter

  const [rr, gg, bb] = hslToRgb(h, sat, light);
  return `rgb(${rr}, ${gg}, ${bb})`;
}

// ---- rgb <-> hsl helpers ----

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ];
}

