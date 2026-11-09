/**
 * Browser-side image compression — every upload (hero photos, project
 * thumbnails, post images) is resized + re-encoded here before it ever
 * touches Firestore. Keeps documents small, keeps the site on the free
 * plan, never sends files anywhere but your own database.
 */

export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number; maxKB?: number } = {}
): Promise<string> {
  const { maxDim = 1400, quality = 0.78, maxKB = 480 } = opts;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image file"));
      el.src = url;
    });

    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, w, h);

    let q = quality;
    let dataUrl = canvas.toDataURL("image/jpeg", q);
    // walk quality down until comfortably under the cap
    while (dataUrl.length / 1024 > maxKB && q > 0.4) {
      q -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", q);
    }
    if (dataUrl.length / 1024 > maxKB) {
      // last resort: shrink dimensions
      const w2 = Math.round(w * 0.7);
      const h2 = Math.round(h * 0.7);
      canvas.width = w2;
      canvas.height = h2;
      ctx.drawImage(img, 0, 0, w2, h2);
      dataUrl = canvas.toDataURL("image/jpeg", Math.max(0.4, q));
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}
