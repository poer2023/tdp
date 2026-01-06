"use client";

import { useState, useCallback, useRef } from "react";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface QueueItem {
    id: string;
    file: File;
    preview: string;
    status: UploadStatus;
    progress: number;
    uploadedUrl?: string;
    uploadedData?: Record<string, unknown>;
    error?: string;
}

interface UseImageUploadOptions {
    endpoint: string;
    fieldName?: string;
    extraFormData?: Record<string, string>;
    autoUpload?: boolean;
    onUploadComplete?: (item: QueueItem) => void;
    onUploadError?: (item: QueueItem, error: string) => void;
}

/**
 * useImageUpload - Hook for optimistic image upload with progress tracking
 * 
 * Features:
 * - Immediate local preview via URL.createObjectURL
 * - Auto-upload on file add (optional)
 * - XHR upload with progress events
 * - Retry failed uploads
 * - Status tracking per file
 */
export function useImageUpload({
    endpoint,
    fieldName = "image",
    extraFormData = {},
    autoUpload = true,
    onUploadComplete,
    onUploadError,
}: UseImageUploadOptions) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const abortControllers = useRef<Map<string, AbortController>>(new Map());

    const generateId = () => Math.random().toString(36).substring(2, 11);

    const uploadFile = useCallback(
        async (item: QueueItem) => {
            const controller = new AbortController();
            abortControllers.current.set(item.id, controller);

            setQueue((prev) =>
                prev.map((q) =>
                    q.id === item.id ? { ...q, status: "uploading" as const, progress: 0 } : q
                )
            );

            return new Promise<void>((resolve) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
                        );
                    }
                });

                xhr.addEventListener("load", () => {
                    abortControllers.current.delete(item.id);

                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            const uploadedUrl =
                                data.image?.filePath ||
                                data.image?.mediumPath ||
                                data.coverUrl ||
                                data.url ||
                                "";

                            setQueue((prev) =>
                                prev.map((q) =>
                                    q.id === item.id
                                        ? {
                                            ...q,
                                            status: "success" as const,
                                            progress: 100,
                                            uploadedUrl,
                                            uploadedData: data,
                                        }
                                        : q
                                )
                            );

                            onUploadComplete?.({
                                ...item,
                                status: "success",
                                progress: 100,
                                uploadedUrl,
                                uploadedData: data,
                            });
                        } catch {
                            setQueue((prev) =>
                                prev.map((q) =>
                                    q.id === item.id
                                        ? { ...q, status: "error" as const, error: "Invalid response" }
                                        : q
                                )
                            );
                            onUploadError?.(item, "Invalid response");
                        }
                    } else {
                        const errorMsg = `Upload failed: ${xhr.status}`;
                        setQueue((prev) =>
                            prev.map((q) =>
                                q.id === item.id ? { ...q, status: "error" as const, error: errorMsg } : q
                            )
                        );
                        onUploadError?.(item, errorMsg);
                    }
                    resolve();
                });

                xhr.addEventListener("error", () => {
                    abortControllers.current.delete(item.id);
                    const errorMsg = "Network error";
                    setQueue((prev) =>
                        prev.map((q) =>
                            q.id === item.id ? { ...q, status: "error" as const, error: errorMsg } : q
                        )
                    );
                    onUploadError?.(item, errorMsg);
                    resolve();
                });

                xhr.addEventListener("abort", () => {
                    abortControllers.current.delete(item.id);
                    resolve();
                });

                const formData = new FormData();
                formData.append(fieldName, item.file);
                Object.entries(extraFormData).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                xhr.open("POST", endpoint);
                xhr.send(formData);
            });
        },
        [endpoint, fieldName, extraFormData, onUploadComplete, onUploadError]
    );

    const addFiles = useCallback(
        (files: File[]) => {
            const newItems: QueueItem[] = files.map((file) => ({
                id: generateId(),
                file,
                preview: URL.createObjectURL(file),
                status: "pending" as const,
                progress: 0,
            }));

            setQueue((prev) => [...prev, ...newItems]);

            if (autoUpload) {
                newItems.forEach((item) => {
                    uploadFile(item);
                });
            }

            return newItems;
        },
        [autoUpload, uploadFile]
    );

    const removeFile = useCallback((id: string) => {
        setQueue((prev) => {
            const item = prev.find((q) => q.id === id);
            if (item) {
                URL.revokeObjectURL(item.preview);
                const controller = abortControllers.current.get(id);
                if (controller) {
                    controller.abort();
                    abortControllers.current.delete(id);
                }
            }
            return prev.filter((q) => q.id !== id);
        });
    }, []);

    const retryFile = useCallback(
        (id: string) => {
            const item = queue.find((q) => q.id === id);
            if (item && item.status === "error") {
                uploadFile(item);
            }
        },
        [queue, uploadFile]
    );

    const clearQueue = useCallback(() => {
        queue.forEach((item) => {
            URL.revokeObjectURL(item.preview);
            const controller = abortControllers.current.get(item.id);
            if (controller) {
                controller.abort();
            }
        });
        abortControllers.current.clear();
        setQueue([]);
    }, [queue]);

    const getUploadedUrls = useCallback(() => {
        return queue
            .filter((q) => q.status === "success" && q.uploadedUrl)
            .map((q) => q.uploadedUrl!);
    }, [queue]);

    const getUploadedData = useCallback(() => {
        return queue
            .filter((q) => q.status === "success" && q.uploadedData)
            .map((q) => q.uploadedData!);
    }, [queue]);

    const isUploading = queue.some((q) => q.status === "uploading");
    const hasPending = queue.some((q) => q.status === "pending");
    const hasErrors = queue.some((q) => q.status === "error");
    const allComplete = queue.length > 0 && queue.every((q) => q.status === "success");

    return {
        queue,
        addFiles,
        removeFile,
        retryFile,
        clearQueue,
        getUploadedUrls,
        getUploadedData,
        isUploading,
        hasPending,
        hasErrors,
        allComplete,
        uploadFile,
    };
}

export default useImageUpload;
