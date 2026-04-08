import { ipcRenderer } from 'electron';

export interface WindowSource {
  id: string;
  name: string;
  thumbnail: string;
  appId?: string;
}

export interface CaptureResult {
  success: boolean;
  image?: string;
  timestamp?: number;
  error?: string;
  sourceName?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export class CaptureAgentService {
  private isCapturing = false;
  private currentSourceId: string | null = null;
  private captureInterval: NodeJS.Timeout | null = null;

  async detectMeetingWindows(): Promise<WindowSource[]> {
    return await ipcRenderer.invoke('detect-meeting-windows');
  }

  async getAvailableSources(): Promise<WindowSource[]> {
    return await ipcRenderer.invoke('get-sources');
  }

  async startCapture(sourceId: string): Promise<CaptureResult> {
    const result = await ipcRenderer.invoke('start-capture', sourceId);
    
    if (result.success) {
      this.isCapturing = true;
      this.currentSourceId = sourceId;
    }
    
    return result;
  }

  async stopCapture(): Promise<CaptureResult> {
    const result = await ipcRenderer.invoke('stop-capture');
    
    if (result.success) {
      this.isCapturing = false;
      this.currentSourceId = null;
      
      if (this.captureInterval) {
        clearInterval(this.captureInterval);
        this.captureInterval = null;
      }
    }
    
    return result;
  }

  async captureFrame(quality: number = 0.8): Promise<CaptureResult> {
    return await ipcRenderer.invoke('capture-frame', { quality });
  }

  startAutoCapture(intervalMs: number = 5000, onCapture: (image: string) => void): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }

    this.captureInterval = setInterval(async () => {
      if (this.isCapturing) {
        const result = await this.captureFrame();
        if (result.success && result.image) {
          onCapture(result.image);
        }
      }
    }, intervalMs);
  }

  isCurrentlyCapturing(): boolean {
    return this.isCapturing;
  }

  getCurrentSourceId(): string | null {
    return this.currentSourceId;
  }
}

// Export singleton instance
export const captureAgent = new CaptureAgentService();
