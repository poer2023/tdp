"use client";

import { useState, useCallback, useRef } from "react";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadItem {
    id: string;
    file: File;
    preview: string;
    progress: number;
    status: UploadStatus;
    error?: string;
    result?: unknown;
}

interface UseUploadOptions {
    onSuccess?: (item: UploadItem, result: unknown) => void;
    onError?: (item: UploadItem, error: Error) => void;
    onProgress?: (item: UploadItem) => void;
}

/**
 * Hook for managing file uploads with progress tracking
 */
export function useUpload(options: UseUploadOptions = {}) {
    const [items, setItems] = useState<UploadItem[]>([]);
    const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

    const addFiles = useCallback((files: File[]) => {
        const newItems: UploadItem[] = files.map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file),
            progress: 0,
            status: "idle" as const,
        }));
        setItems((prev) => [...prev, ...newItems]);
        return newItems;
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => {
            const item = prev.find((i) => i.id === id);
            if (item) {
                URL.revokeObjectURL(item.preview);
                // Cancel upload if in progress
                const controller = abortControllersRef.current.get(id);
                if (controller) {
                    controller.abort();
                    abortControllersRef.current.delete(id);
                }
            }
            return prev.filter((i) => i.id !== id);
        });
    }, []);

    const clearAll = useCallback(() => {
        items.forEach((item) => {
            URL.revokeObjectURL(item.preview);
            const controller = abortControllersRef.current.get(item.id);
            if (controller) controller.abort();
        });
        abortControllersRef.current.clear();
        setItems([]);
    }, [items]);

    const uploadItem = useCallback(
        async (
            item: UploadItem,
            endpoint: string,
            extraData?: Record<string, string>
        ): Promise<unknown> => {
            const controller = new AbortController();
            abortControllersRef.current.set(item.id, controller);

            // Update status to uploading
            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" as const, progress: 0 } : i))
            );

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
                        );
                        const updatedItem = { ...item, progress };
                        options.onProgress?.(updatedItem);
                    }
                };

                xhr.onload = () => {
                    abortControllersRef.current.delete(item.id);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            setItems((prev) =>
                                prev.map((i) =>
                                    i.id === item.id
                                        ? { ...i, status: "success" as const, progress: 100, result }
                                        : i
                                )
                            );
                            const successItem = { ...item, status: "success" as const, progress: 100, result };
                            options.onSuccess?.(successItem, result);
                            resolve(result);
                        } catch {
                            const error = new Error("Invalid response");
                            setItems((prev) =>
                                prev.map((i) =>
                                    i.id === item.id
                                        ? { ...i, status: "error" as const, error: error.message }
                                        : i
                                )
                            );
                            options.onError?.({ ...item, status: "error", error: error.message }, error);
                            reject(error);
                        }
                    } else {
                        const error = new Error(`Upload failed: ${xhr.status}`);
                        setItems((prev) =>
                            prev.map((i) =>
                                i.id === item.id
                                    ? { ...i, status: "error" as const, error: error.message }
                                    : i
                            )
                        );
                        options.onError?.({ ...item, status: "error", error: error.message }, error);
                        reject(error);
                    }
                };

                xhr.onerror = () => {
                    abortControllersRef.current.delete(item.id);
                    const error = new Error("Network error");
                    setItems((prev) =>
                        prev.map((i) =>
                            i.id === item.id
                                ? { ...i, status: "error" as const, error: error.message }
                                : i
                        )
                    );
                    options.onError?.({ ...item, status: "error", error: error.message }, error);
                    reject(error);
                };

                xhr.onabort = () => {
                    abortControllersRef.current.delete(item.id);
                    reject(new Error("Cancelled"));
                };

                // Handle abort signal
                controller.signal.addEventListener("abort", () => {
                    xhr.abort();
                });

                const formData = new FormData();
                formData.append("image", item.file);
                if (extraData) {
                    Object.entries(extraData).forEach(([key, value]) => {
                        formData.append(key, value);
                    });
                }

                xhr.open("POST", endpoint);
                xhr.send(formData);
            });
        },
        [options]
    );

    const uploadAll = useCallback(
        async (endpoint: string, extraData?: Record<string, string>) => {
            const pendingItems = items.filter((i) => i.status === "idle");
            const results = await Promise.allSettled(
                pendingItems.map((item) => uploadItem(item, endpoint, extraData))
            );
            return results;
        },
        [items, uploadItem]
    );

    return {
        items,
        addFiles,
        removeItem,
        clearAll,
        uploadItem,
        uploadAll,
        isUploading: items.some((i) => i.status === "uploading"),
        hasErrors: items.some((i) => i.status === "error"),
        allComplete: items.length > 0 && items.every((i) => i.status === "success"),
    };
}

export default useUpload;
