import API, { apiWithRetry } from "./api";
import { config } from "../config/env";

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  imageUrl?: string;
  message?: string;
}

export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiWithRetry(
      () =>
        API.post<ImageUploadResponse>(
          `${config.apiBaseUrl}/upload/image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
              }
            },
          }
        ),
      {
        maxRetries: 2,
        retryDelay: 1000,
      }
    );

    return response.data;
  } catch (error: any) {
    const apiError = error as { message?: string };
    throw new Error(apiError.message || "Failed to upload image");
  }
}

export async function uploadImageWithQueue(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
  const networkStatus = await import("../services/nativeService").then((m) =>
    m.networkService.getStatus()
  );

  if (!networkStatus.connected) {
    const offlineQueue = await import("../utils/offlineQueue").then(
      (m) => m.offlineQueue
    );
    await offlineQueue.add({
      type: "uploadImage",
      data: { file },
    });

    throw new Error(
      "Offline: Image will be uploaded when connection is restored"
    );
  }

  return uploadImage(file, onProgress);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Kích thước file không được vượt quá 10MB",
    };
  }

  return { valid: true };
}
