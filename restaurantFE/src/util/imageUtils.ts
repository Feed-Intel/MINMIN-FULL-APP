export const base64ToBlob = (
  base64Data: string,
  contentType?: string
): Blob => {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

export const normalizeImageUrl = (url?: string | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return undefined;
  }

  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  try {
    const parsed = new URL(trimmedUrl);
    const hostname = parsed.hostname.toLowerCase();
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.localhost');

    if (isLocalHost) {
      return trimmedUrl.replace(/^https:\/\//i, 'http://');
    }

    return trimmedUrl.replace(/^http:\/\//i, 'https://');
  } catch (error) {
    return trimmedUrl;
  }
};

export const buildImageUrl = (path?: string | null) => {
  if (!path) {
    return null;
  }

  if (/^https?:/i.test(path)) {
    return path;
  }

  const base = process.env.EXPO_PUBLIC_IMAGE_PATH ?? '';
  if (!base) {
    return path;
  }

  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const sanitizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${sanitizedBase}/${sanitizedPath}`;
};
