import { networkService } from "../services/nativeService";
import API from "../services/api";

export interface QueuedRequest {
  id: string;
  type: "apiCall" | "uploadImage" | "custom";
  data: any;
  timestamp: number;
  retries: number;
  maxRetries?: number;
}

const QUEUE_STORAGE_KEY = "offline_queue";
const MAX_RETRIES = 3;

class OfflineQueueService {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private networkListener: (() => void) | null = null;

  constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  async add(
    request: Omit<QueuedRequest, "id" | "timestamp" | "retries">
  ): Promise<string> {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedRequest: QueuedRequest = {
      id,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: MAX_RETRIES,
      ...request,
    };

    this.queue.push(queuedRequest);
    this.saveQueue();

    const networkStatus = await networkService.getStatus();
    if (networkStatus.connected) {
      this.processQueue();
    }

    return id;
  }

  remove(id: string): void {
    this.queue = this.queue.filter((req) => req.id !== id);
    this.saveQueue();
  }

  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    const networkStatus = await networkService.getStatus();
    if (!networkStatus.connected) {
      return;
    }

    this.processing = true;

    const requestsToProcess = [...this.queue];

    for (const request of requestsToProcess) {
      try {
        await this.processRequest(request);
        this.remove(request.id);
      } catch (error) {
        console.error(`Failed to process queued request ${request.id}:`, error);
        request.retries += 1;

        if (request.retries >= (request.maxRetries || MAX_RETRIES)) {
          console.warn(
            `Request ${request.id} exceeded max retries, removing from queue`
          );
          this.remove(request.id);
        } else {
          const index = this.queue.findIndex((r) => r.id === request.id);
          if (index !== -1) {
            this.queue[index] = request;
            this.saveQueue();
          }
        }
      }
    }

    this.processing = false;
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    switch (request.type) {
      case "apiCall":
        await this.processApiCall(request);
        break;
      case "uploadImage":
        await this.processImageUpload(request);
        break;
      case "custom":
        console.warn("Custom request type not implemented:", request);
        break;
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  private async processApiCall(request: QueuedRequest): Promise<void> {
    const { method, url, data, headers } = request.data;

    let response;
    switch (method?.toUpperCase() || "POST") {
      case "GET":
        response = await API.get(url, { headers });
        break;
      case "POST":
        response = await API.post(url, data, { headers });
        break;
      case "PUT":
        response = await API.put(url, data, { headers });
        break;
      case "DELETE":
        response = await API.delete(url, { headers });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    if (request.data.onSuccess) {
      request.data.onSuccess(response.data);
    }
  }

  private async processImageUpload(request: QueuedRequest): Promise<void> {
    const { file } = request.data;

    let fileToUpload: File;
    if (typeof file === "string") {
      throw new Error("Base64 file conversion not implemented yet");
    } else {
      fileToUpload = file;
    }

    const formData = new FormData();
    formData.append("image", fileToUpload);

    const response = await API.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (request.data.onSuccess) {
      request.data.onSuccess(response.data);
    }
  }

  private setupNetworkListener(): void {
    this.networkListener = networkService.addListener((status) => {
      if (status.connected && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  destroy(): void {
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }
  }
}

export const offlineQueue = new OfflineQueueService();
