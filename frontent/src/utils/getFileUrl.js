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
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';
  return `${backendBase}${cleanPath}`;
};

export default getFileUrl;
