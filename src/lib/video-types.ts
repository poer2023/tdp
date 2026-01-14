/**
 * 统一的视频数据类型定义
 * 供前后端共享使用，确保数据结构一致
 */

/**
 * 视频上传 API 响应
 * 后端 /api/admin/video/upload 返回的数据结构
 */
export interface VideoUploadResponse {
    success: boolean;
    video: {
        url: string;           // 原始视频 R2 URL
        previewUrl: string;    // 压缩预览 R2 URL
        thumbnailUrl: string;  // 缩略图 R2 URL
        duration: number;      // 视频时长（秒）
        width: number;         // 视频宽度
        height: number;        // 视频高度
        originalSize: number;  // 原始文件大小（字节）
        previewSize: number;   // 预览文件大小（字节）
    };
    image?: any;             // Gallery 记录（可选）
    compressionRatio?: string;
    message?: string;
}

/**
 * Moment 视频数据
 * 存储在 Moment.videos JSON 字段中
 */
export interface MomentVideoData {
    url: string;              // 原始视频 URL
    previewUrl: string;       // 预览视频 URL（压缩版）- 必填
    thumbnailUrl: string;     // 缩略图 URL - 必填
    duration: number;         // 视频时长 - 必填
    w?: number;               // 视频宽度
    h?: number;               // 视频高度
}

/**
 * 将 API 响应转换为 Moment 视频数据
 */
export function convertToMomentVideoData(
    response: VideoUploadResponse
): MomentVideoData | null {
    if (!response?.video) {
        return null;
    }

    return {
        url: response.video.url,
        previewUrl: response.video.previewUrl,
        thumbnailUrl: response.video.thumbnailUrl,
        duration: response.video.duration,
        w: response.video.width,
        h: response.video.height,
    };
}
