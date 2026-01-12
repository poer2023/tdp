/**
 * Extract a thumbnail from a video file using canvas
 * Works client-side only (requires browser APIs)
 */
export async function extractVideoThumbnail(
  videoFile: File,
  seekTime: number = 0.1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
      canvas.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to the specified time (or 0.1s to skip black frames)
      video.currentTime = Math.min(seekTime, video.duration);
    };

    video.onseeked = () => {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL (WebP for smaller size, fallback to JPEG)
      let thumbnailUrl: string;
      try {
        thumbnailUrl = canvas.toDataURL("image/webp", 0.8);
        // Some browsers don't support WebP, check if it worked
        if (!thumbnailUrl.startsWith("data:image/webp")) {
          thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
        }
      } catch {
        thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
      }

      cleanup();
      resolve(thumbnailUrl);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video"));
    };

    // Set video source from file
    video.src = URL.createObjectURL(videoFile);
  });
}
