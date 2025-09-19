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
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost");

    if (isLocalHost) {
      return trimmedUrl.replace(/^https:\/\//i, "http://");
    }

    return trimmedUrl.replace(/^http:\/\//i, "https://");
  } catch (error) {
    return trimmedUrl;
  }
};
