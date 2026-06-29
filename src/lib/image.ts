/**
 * Downscales an image data URL to a small JPEG thumbnail (client-side, via
 * canvas) so it can be stored inline in a text column without bloating rows.
 * Returns undefined if anything fails.
 */
export async function makeThumbnail(dataUrl: string, max = 256, quality = 0.7): Promise<string | undefined> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img load"));
      img.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return undefined;
  }
}

/** Reads a File into a data URL string. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("file read"));
    reader.readAsDataURL(file);
  });
}
