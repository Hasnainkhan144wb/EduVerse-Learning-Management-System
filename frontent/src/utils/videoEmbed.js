/**
 * Converts standard YouTube, Vimeo, or direct video links into embeddable iframe URLs.
 * Resolves "www.youtube.com refused to connect" error by converting watch/short links to /embed/.
 */
export const getEmbedUrl = (url) => {
  if (!url) return '';

  const cleanUrl = String(url).trim();

  // Direct video files (.mp4, .webm, .ogg)
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg')) {
    return cleanUrl;
  }

  // YouTube match regex (supports youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.)
  const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(youtubeRegExp);

  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
  }

  // Vimeo link support
  if (cleanUrl.includes('vimeo.com')) {
    const vimeoId = cleanUrl.split('/').pop();
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return cleanUrl;
};
