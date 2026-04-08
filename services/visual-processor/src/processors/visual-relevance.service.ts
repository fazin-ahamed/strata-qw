import { Injectable, Logger } from '@nestjs/common';
import { VisualElement } from './screenshot.processor';

export interface RelevanceAnalysis {
  score: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  recommendation: 'save' | 'review' | 'discard';
  confidence: number;
}

@Injectable()
export class VisualRelevanceService {
  private readonly logger = new Logger(VisualRelevanceService.name);

  async analyzeRelevance(
    imageBuffer: Buffer,
    visualElements: VisualElement[],
    context: {
      meetingTranscript?: string;
      currentTimecode?: number;
      previousScreenshots?: string[];
      userPreferences?: Record<string, any>;
    }
  ): Promise<RelevanceAnalysis> {
    this.logger.log('Analyzing visual relevance...');

    const factors: Array<{ name: string; impact: number; description: string }> = [];
    let totalScore = 0.5; // Base score

    // Factor 1: Visual element presence
    const importantElements = visualElements.filter(el =>
      ['chart', 'graph', 'slide', 'table', 'code'].includes(el.type)
    );
    
    if (importantElements.length > 0) {
      const elementImpact = Math.min(importantElements.length * 0.1, 0.3);
      totalScore += elementImpact;
      factors.push({
        name: 'Important Visual Elements',
        impact: elementImpact,
        description: `${importantElements.length} relevant visual elements detected`,
      });
    }

    // Factor 2: Transcript correlation
    if (context.meetingTranscript) {
      const hasVisualReferences = this.detectVisualReferences(context.meetingTranscript);
      if (hasVisualReferences) {
        totalScore += 0.2;
        factors.push({
          name: 'Transcript Reference',
          impact: 0.2,
          description: 'Speaker referenced visual content',
        });
      }
    }

    // Factor 3: Change detection
    if (context.previousScreenshots && context.previousScreenshots.length > 0) {
      const hasChanges = await this.detectSignificantChanges(
        imageBuffer,
        context.previousScreenshots
      );
      if (hasChanges) {
        totalScore += 0.15;
        factors.push({
          name: 'Content Change',
          impact: 0.15,
          description: 'Significant visual change from previous frame',
        });
      }
    }

    // Determine recommendation
    let recommendation: 'save' | 'review' | 'discard';
    if (totalScore >= 0.75) {
      recommendation = 'save';
    } else if (totalScore >= 0.5) {
      recommendation = 'review';
    } else {
      recommendation = 'discard';
    }

    return {
      score: Math.min(totalScore, 1.0),
      factors,
      recommendation,
      confidence: 0.85,
    };
  }

  private detectVisualReferences(transcript: string): boolean {
    const visualKeywords = [
      'as you can see',
      'look at this',
      'shown here',
      'on this slide',
      'in this chart',
      'as illustrated',
      'check out',
      'notice',
      'observe',
      'here we have',
    ];

    const lowerTranscript = transcript.toLowerCase();
    return visualKeywords.some(keyword => lowerTranscript.includes(keyword));
  }

  private async detectSignificantChanges(
    currentImage: Buffer,
    previousScreenshotIds: string[]
  ): Promise<boolean> {
    // In production, would compare actual image data
    // Using perceptual hashing or structural similarity
    
    this.logger.log('Detecting changes from previous screenshots...');
    
    // Placeholder - assume there are changes
    return true;
  }

  async prioritizeScreenshots(
    screenshots: Array<{
      id: string;
      buffer: Buffer;
      visualElements: VisualElement[];
      timestamp: Date;
    }>,
    limit: number = 10
  ): Promise<string[]> {
    // Rank and select most relevant screenshots
    const scored = await Promise.all(
      screenshots.map(async s => {
        const analysis = await this.analyzeRelevance(s.buffer, s.visualElements, {});
        return { id: s.id, score: analysis.score, timestamp: s.timestamp };
      })
    );

    // Sort by score (descending), then by timestamp (ascending for ties)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    // Return top N IDs
    return scored.slice(0, limit).map(s => s.id);
  }

  shouldCaptureFrame(
    transcriptChunk: string,
    lastCaptureTime: Date,
    minIntervalSeconds: number = 5
  ): boolean {
    // Decide whether to capture based on transcript and timing
    const now = new Date();
    const timeSinceLastCapture = (now.getTime() - lastCaptureTime.getTime()) / 1000;

    // Don't capture too frequently
    if (timeSinceLastCapture < minIntervalSeconds) {
      return false;
    }

    // Capture if visual reference detected
    if (this.detectVisualReferences(transcriptChunk)) {
      return true;
    }

    return false;
  }
}
