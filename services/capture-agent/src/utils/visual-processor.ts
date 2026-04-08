import axios from 'axios';

export interface VisualSnippet {
  id: string;
  meetingId: string;
  imageUrl: string;
  timestamp: Date;
  context?: string;
  approved: boolean;
  relevanceScore?: number;
}

export interface VisualProcessorConfig {
  apiEndpoint: string;
  apiKey: string;
  autoDeleteUnapprovedHours: number;
}

export class VisualProcessorService {
  private config: VisualProcessorConfig;
  private pendingSnippets: Map<string, VisualSnippet> = new Map();

  constructor(config: VisualProcessorConfig) {
    this.config = config;
  }

  /**
   * Send captured frame to AI service for relevance analysis
   */
  async analyzeRelevance(imageBase64: string, meetingContext: any): Promise<{
    isRelevant: boolean;
    confidence: number;
    reason?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.config.apiEndpoint}/ai/analyze-visual`,
        {
          image: imageBase64,
          context: meetingContext,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        isRelevant: response.data.isRelevant,
        confidence: response.data.confidence,
        reason: response.data.reason,
      };
    } catch (error) {
      console.error('Visual analysis failed:', error);
      // Default to not relevant on error for safety
      return { isRelevant: false, confidence: 0 };
    }
  }

  /**
   * Save visual snippet after user approval
   */
  async saveSnippet(
    meetingId: string,
    imageBase64: string,
    context?: string
  ): Promise<VisualSnippet> {
    const snippet: VisualSnippet = {
      id: this.generateId(),
      meetingId,
      imageUrl: '', // Will be populated after upload
      timestamp: new Date(),
      context,
      approved: true,
    };

    try {
      // Upload image to storage service
      const uploadResponse = await axios.post(
        `${this.config.apiEndpoint}/storage/upload-visual`,
        {
          meetingId,
          image: imageBase64,
          snippetId: snippet.id,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      snippet.imageUrl = uploadResponse.data.url;

      // Save metadata to database
      await axios.post(
        `${this.config.apiEndpoint}/visual-snippets`,
        snippet,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return snippet;
    } catch (error) {
      console.error('Failed to save visual snippet:', error);
      throw error;
    }
  }

  /**
   * Queue snippet for user approval
   */
  queueForApproval(snippet: VisualSnippet): void {
    this.pendingSnippets.set(snippet.id, snippet);
  }

  /**
   * User approves a pending snippet
   */
  async approveSnippet(snippetId: string): Promise<VisualSnippet | null> {
    const snippet = this.pendingSnippets.get(snippetId);
    if (!snippet) {
      return null;
    }

    snippet.approved = true;
    this.pendingSnippets.delete(snippetId);

    // Save to permanent storage
    return snippet;
  }

  /**
   * User rejects a pending snippet
   */
  rejectSnippet(snippetId: string): void {
    this.pendingSnippets.delete(snippetId);
    // Image will be auto-deleted by cleanup job
  }

  /**
   * Get all pending snippets for user review
   */
  getPendingSnippets(): VisualSnippet[] {
    return Array.from(this.pendingSnippets.values());
  }

  /**
   * Cleanup unapproved snippets after timeout
   */
  async cleanupUnapprovedSnippets(): Promise<number> {
    const now = Date.now();
    const cutoffMs = this.config.autoDeleteUnapprovedHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [id, snippet] of this.pendingSnippets.entries()) {
      const ageMs = now - snippet.timestamp.getTime();
      if (ageMs > cutoffMs) {
        this.pendingSnippets.delete(id);
        deletedCount++;
        
        // Notify storage service to delete the image
        try {
          await axios.delete(
            `${this.config.apiEndpoint}/storage/visual/${id}`,
            {
              headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
              },
            }
          );
        } catch (error) {
          console.error(`Failed to delete unapproved snippet ${id}:`, error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * Detect moments requiring visual capture based on speech patterns
   */
  shouldCaptureFromTranscript(transcriptSegment: string): boolean {
    const visualCues = [
      'as shown here',
      'look at this',
      'as you can see',
      'this chart',
      'this graph',
      'on this slide',
      'in this screenshot',
      'let me show you',
      'check this out',
      'notice this',
    ];

    const lowerTranscript = transcriptSegment.toLowerCase();
    return visualCues.some(cue => lowerTranscript.includes(cue));
  }

  /**
   * Detect screen changes that might indicate important content
   */
  detectSignificantChange(
    previousFrame: string,
    currentFrame: string,
    threshold: number = 0.3
  ): boolean {
    // Simple hash-based change detection
    // In production, use perceptual hashing or structural similarity
    const hash1 = this.simpleHash(previousFrame);
    const hash2 = this.simpleHash(currentFrame);
    
    const diffRatio = this.hammingDistance(hash1, hash2) / Math.max(hash1.length, hash2.length);
    return diffRatio > threshold;
  }

  private generateId(): string {
    return `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(2).padStart(32, '0');
  }

  private hammingDistance(str1: string, str2: string): number {
    let distance = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] !== str2[i]) {
        distance++;
      }
    }
    return distance;
  }
}
