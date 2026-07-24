/**
 * Resizes and re-encodes an image client-side before upload, using the
 * canvas API directly rather than pulling in a compression library —
 * this app already learned the hard way (jsPDF/html2canvas) that "just
 * add a package" has a real bundle-size cost. Downscales to a max
 * dimension and re-encodes as JPEG at a reasonable quality, which is
 * enough to turn multi-MB phone photos into a few hundred KB without a
 * visible quality hit for product photography.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  // Only compress what canvas can actually re-encode; pass anything else through untouched.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob || blob.size >= file.size) return file; // don't "compress" into something bigger

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
