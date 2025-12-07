import { fileSystemService } from "../services/nativeService";

export const fileSystem = {
  async read(path: string): Promise<string> {
    return await fileSystemService.readFile(path);
  },

  async write(path: string, data: string): Promise<void> {
    return await fileSystemService.writeFile(path, data);
  },

  async delete(path: string): Promise<void> {
    return await fileSystemService.deleteFile(path);
  },

  async saveJSON(path: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    return await fileSystemService.writeFile(path, jsonString);
  },

  async readJSON<T = any>(path: string): Promise<T | null> {
    try {
      const content = await fileSystemService.readFile(path);
      return JSON.parse(content) as T;
    } catch (error) {
      console.error("Failed to read JSON file:", error);
      return null;
    }
  },
};
