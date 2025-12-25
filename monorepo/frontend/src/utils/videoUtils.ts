/**
 * Extracts the YouTube video ID from various YouTube URL formats and returns an embed URL.
 * Returns null if the URL is invalid or not a YouTube URL.
 */
export const getYouTubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;

    // Match YouTube video ID
    // Supports:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - etc.
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
};
