export const getFileUrl = (filePath) => {
  if (!filePath) {
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
  }
  // If already an absolute HTTP URL, HTTPS URL, blob URL, or data URI
  if (
    filePath.startsWith('http://') ||
    filePath.startsWith('https://') ||
    filePath.startsWith('blob:') ||
    filePath.startsWith('data:')
  ) {
    return filePath;
  }
  // Clean path slashes
  const rawBase =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
    '';
  const backendBase = rawBase ? rawBase.replace(/\/api\/?$/, '') : '';
  return `${backendBase}${cleanPath}`;
};

export default getFileUrl;
