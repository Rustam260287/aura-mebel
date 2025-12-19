import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a File object to a base64 encoded string, without the data URI prefix.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Failed to read file as data URL.'));
      }
      // result is "data:image/jpeg;base64,LzlqLzRBQ...""
      // we need to remove the prefix "data:[mime-type];base64,"
      const base64String = reader.result.split(',')[1];
      if (!base64String) {
        return reject(new Error('Failed to extract base64 string from data URL.'));
      }
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fetches an image from a URL and converts it to a base64 encoded string.
 * @param url The URL of the image to convert.
 * @returns A promise that resolves with an object containing the base64 string and mime type.
 */
export const imageUrlToBase64 = (url: string): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            return reject(new Error('Failed to read blob as data URL.'));
          }
          const base64String = reader.result.split(',')[1];
          if (!base64String) {
            return reject(new Error('Failed to extract base64 string from data URL.'));
          }
          resolve({ base64: base64String, mimeType: blob.type });
        };
        reader.onerror = (error) => reject(error);
      })
      .catch(error => reject(`Failed to fetch and convert image: ${error}`));
  });
};
