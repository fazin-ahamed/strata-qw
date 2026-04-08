import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface VisualSnippet {
  id: string;
  meetingId: string;
  imageUrl: string;
  timestamp: Date;
  context?: string;
  approved: boolean;
  relevanceScore?: number;
}

@Injectable()
export class VisualProcessorService {
  private pendingSnippets: Map<string, VisualSnippet> = new Map();
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(process.cwd(), 'storage', 'visuals');
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Analyze image relevance using AI vision model
   */
  async analyzeRelevance(
    imageBase64: string,
    context?: any
  ): Promise<{
    isRelevant: boolean;
    confidence: number;
    reason?: string;
  }> {
    // In production, call vision model API (e.g., CLIP, custom model)
    // For now, use heuristic-based detection
    
    const visualCues = [
      'chart',
      'graph',
      'slide',
      'diagram',
      'screenshot',
      'dashboard',
      'presentation',
    ];

    // Decode image to check dimensions (slides/presentations typically have specific aspect ratios)
    const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
    
    // Simple heuristic: assume images with presentation-like characteristics are relevant
    // In production, use actual vision model
    const isRelevant = Math.random() > 0.5; // Placeholder
    const confidence = 0.75; // Placeholder

    return {
      isRelevant,
      confidence,
      reason: isRelevant ? 'Detected potential presentation content' : 'No significant visual content detected',
    };
  }

  /**
   * Store image to disk
   */
  async storeImage(
    meetingId: string,
    imageBase64: string,
    snippetId: string
  ): Promise<string> {
    const filename = `${snippetId}.png`;
    const filepath = path.join(this.storagePath, meetingId, filename);
    
    // Create meeting directory if not exists
    const meetingDir = path.join(this.storagePath, meetingId);
    if (!fs.existsSync(meetingDir)) {
      fs.mkdirSync(meetingDir, { recursive: true });
    }

    // Write image file
    const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
    fs.writeFileSync(filepath, imageBuffer);

    // Return URL path
    return `/storage/visuals/${meetingId}/${filename}`;
  }

  /**
   * Delete stored image
   */
  async deleteImage(snippetId: string): Promise<void> {
    // Find and delete the image file
    const meetingDirs = fs.readdirSync(this.storagePath);
    
    for (const meetingId of meetingDirs) {
      const meetingDir = path.join(this.storagePath, meetingId);
      const files = fs.readdirSync(meetingDir);
      
      for (const file of files) {
        if (file.startsWith(snippetId)) {
          fs.unlinkSync(path.join(meetingDir, file));
        }
      }
    }
  }

  /**
   * Save snippet metadata
   */
  async saveMetadata(data: Partial<VisualSnippet>): Promise<VisualSnippet> {
    const snippet: VisualSnippet = {
      id: data.id || `vs_${Date.now()}`,
      meetingId: data.meetingId!,
      imageUrl: data.imageUrl || '',
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      context: data.context,
      approved: data.approved ?? false,
      relevanceScore: data.relevanceScore,
    };

    // In production, save to database
    // For now, store in memory
    if (!snippet.approved) {
      this.pendingSnippets.set(snippet.id, snippet);
    }

    return snippet;
  }

  /**
   * Get all pending snippets
   */
  getPendingSnippets(): VisualSnippet[] {
    return Array.from(this.pendingSnippets.values());
  }

  /**
   * Approve a snippet
   */
  async approveSnippet(snippetId: string): Promise<VisualSnippet | null> {
    const snippet = this.pendingSnippets.get(snippetId);
    if (!snippet) {
      return null;
    }

    snippet.approved = true;
    this.pendingSnippets.delete(snippetId);

    // In production, update database
    return snippet;
  }

  /**
   * Reject a snippet
   */
  async rejectSnippet(snippetId: string): Promise<void> {
    this.pendingSnippets.delete(snippetId);
    await this.deleteImage(snippetId);
  }

  /**
   * Cleanup old unapproved snippets
   */
  async cleanupUnapprovedSnippets(hours: number = 24): Promise<number> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [id, snippet] of this.pendingSnippets.entries()) {
      if (snippet.timestamp.getTime() < cutoff) {
        await this.rejectSnippet(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}
