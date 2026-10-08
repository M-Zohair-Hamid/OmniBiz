/**
 * Resolves a logo URL safely across offline base64 data URLs, remote URLs, and local server paths.
 */
export const resolveLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
};

