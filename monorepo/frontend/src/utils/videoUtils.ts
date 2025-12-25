/**
 * Extracts the YouTube video ID from various YouTube URL formats.
 * Returns null if the URL is invalid or not a YouTube URL.
 */
export const getYouTubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;

    // Match YouTube video ID
    // Supports:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - etc.
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Returns an embed URL for a YouTube video.
 */
export const getYouTubeEmbedUrl = (url: string | undefined): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
};

/**
 * Returns a thumbnail URL for a YouTube video.
 */
export const getYouTubeThumbnailUrl = (url: string | undefined): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        // hqdefault.jpg is a reliable high-quality thumbnail
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
};

