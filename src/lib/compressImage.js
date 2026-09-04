/* =========================================================
   compressImage – shrink an image before it goes to Storage
   =========================================================

   Uploads used to go to Supabase Storage untouched, so phone and camera
   originals (6000px, 40-50 MB PNGs) landed in the bucket and the public pages
   then downloaded them at full size to render a ~1200px slide or a ~200px
   thumbnail. Supabase's on-the-fly image transforms are not available on this
   project's plan, so the resize has to happen client-side, before upload.

   Falls back to the original File whenever anything goes wrong, so a decode
   failure can never block an upload.
   ========================================================= */

/* Largest edge we ever need: the widest render is the homepage carousel at
   ~1200px CSS, so 2000px still covers high-DPI screens with room to spare. */
export const MAX_IMAGE_EDGE = 2000;
export const IMAGE_QUALITY = 0.82;

export async function compressImage(file, { maxEdge = MAX_IMAGE_EDGE, quality = IMAGE_QUALITY } = {}) {
  if (!file || !file.type?.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));

    // Already small enough, and not a bloated PNG photo -- leave it alone.
    if (scale === 1 && file.size < 600 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));

    // Never upload something larger than what the user picked.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}
