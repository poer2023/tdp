export interface LivePhotoFiles {
  image: File | null;
  video?: File;
}

export function detectLivePhoto(files: File[]): LivePhotoFiles {
  // 按文件名配对（iOS 导出时同名）
  const imageFile = files.find(
    (f) => f.type.startsWith("image/") || f.name.match(/\.(heic|heif|jpg|jpeg|png)$/i)
  );

  const videoFile = files.find((f) => f.type.startsWith("video/") || f.name.match(/\.(mov|mp4)$/i));

  // 检查是否为配对的 Live Photo（文件名相同，扩展名不同）
  if (imageFile && videoFile) {
    const imageName = imageFile.name.replace(/\.[^.]+$/, "");
    const videoName = videoFile.name.replace(/\.[^.]+$/, "");

    if (imageName === videoName) {
      return { image: imageFile, video: videoFile };
    }
  }

  return { image: imageFile || files[0] || null };
}

export function isHEIC(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}
