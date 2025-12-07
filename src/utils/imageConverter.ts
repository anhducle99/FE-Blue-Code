import { CameraPhoto } from "../services/nativeService";

export async function cameraPhotoToFile(
  photo: CameraPhoto,
  filename: string = "photo.jpg"
): Promise<File> {
  if (photo.dataUrl) {
    return dataURLtoFile(photo.dataUrl, filename);
  }

  if (photo.base64) {
    const dataUrl = `data:image/${photo.format};base64,${photo.base64}`;
    return dataURLtoFile(dataUrl, filename);
  }

  if (photo.webPath) {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  }

  throw new Error("Unable to convert photo to file: no valid data source");
}

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
