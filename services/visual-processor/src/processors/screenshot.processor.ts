import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ScreenshotMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  capturedAt: Date;
  meetingId?: string;
  windowTitle?: string;
}

export interface ProcessedScreenshot {
  id: string;
  buffer: Buffer;
  thumbnailBuffer: Buffer;
  metadata: ScreenshotMetadata;
  visualElements: VisualElement[];
  textContent?: string;
  relevanceScore: number;
}

export interface VisualElement {
  type: 'chart' | 'graph' | 'table' | 'code' | 'image' | 'text' | 'slide';
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  description?: string;
}

export interface CaptureTrigger {
  type: 'manual' | 'auto' | 'voice' | 'screen_change';
  context?: string;
  timestamp: Date;
}

@Injectable()
export class ScreenshotProcessor {
  private readonly logger = new Logger(ScreenshotProcessor.name);

  async processScreenshot(
    imageBuffer: Buffer,
    trigger: CaptureTrigger,
    options?: {
      generateThumbnail?: boolean;
      detectElements?: boolean;
      extractText?: boolean;
    }
  ): Promise<ProcessedScreenshot> {
    this.logger.log('Processing screenshot...');

    const id = `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    const screenshotMetadata: ScreenshotMetadata = {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length,
      capturedAt: new Date(),
    };

    // Generate thumbnail
    let thumbnailBuffer: Buffer;
    if (options?.generateThumbnail !== false) {
      thumbnailBuffer = await this.generateThumbnail(imageBuffer);
    } else {
      thumbnailBuffer = imageBuffer;
    }

    // Detect visual elements
    let visualElements: VisualElement[] = [];
    if (options?.detectElements) {
      visualElements = await this.detectVisualElements(imageBuffer);
    }

    // Extract text (OCR)
    let textContent: string | undefined;
    if (options?.extractText) {
      textContent = await this.extractText(imageBuffer);
    }

    // Calculate relevance score
    const relevanceScore = await this.calculateRelevance(
      imageBuffer,
      trigger,
      visualElements
    );

    return {
      id,
      buffer: imageBuffer,
      thumbnailBuffer,
      metadata: screenshotMetadata,
      visualElements,
      textContent,
      relevanceScore,
    };
  }

  private async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
      .resize(320, 240, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  private async detectVisualElements(imageBuffer: Buffer): Promise<VisualElement[]> {
    // Placeholder for visual element detection
    // In production, would use:
    // - Object detection models (YOLO, Detectron2)
    // - Chart/graph detection models
    // - Layout analysis
    
    this.logger.log('Detecting visual elements...');
    
    // Mock detection
    return [
      {
        type: 'slide',
        boundingBox: { x: 0, y: 0, width: 1920, height: 1080 },
        confidence: 0.9,
        description: 'Presentation slide detected',
      },
    ];
  }

  private async extractText(imageBuffer: Buffer): Promise<string> {
    // Placeholder for OCR
    // In production, would use:
    // - Tesseract.js
    // - Google Cloud Vision
    // - AWS Textract
    
    this.logger.log('Extracting text from image...');
    return '';
  }

  private async calculateRelevance(
    imageBuffer: Buffer,
    trigger: CaptureTrigger,
    visualElements: VisualElement[]
  ): Promise<number> {
    // Calculate relevance based on:
    // - Type of trigger (manual > voice > auto)
    // - Presence of important visual elements
    // - Changes from previous frame
    
    let baseScore = 0.5;

    // Boost for manual captures
    if (trigger.type === 'manual') {
      baseScore += 0.3;
    }

    // Boost for slides/charts
    const hasImportantElements = visualElements.some(
      el => ['chart', 'graph', 'slide', 'table'].includes(el.type)
    );
    if (hasImportantElements) {
      baseScore += 0.2;
    }

    return Math.min(baseScore, 1.0);
  }

  async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    // Optimize image for storage while preserving quality
    return await sharp(imageBuffer)
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }

  async redactSensitiveArea(
    imageBuffer: Buffer,
    areas: Array<{ x: number; y: number; width: number; height: number }>
  ): Promise<Buffer> {
    // Blur or black out sensitive areas
    let pipeline = sharp(imageBuffer);
    
    // This is a simplified version - full implementation would need
    // more sophisticated image manipulation
    for (const area of areas) {
      // Would apply blur/black rectangle to area
      this.logger.log(`Redacting area at ${area.x},${area.y}`);
    }
    
    return await pipeline.toBuffer();
  }

  async compareScreenshots(
    image1: Buffer,
    image2: Buffer,
    threshold: number = 0.95
  ): Promise<{ similar: boolean; differenceScore: number }> {
    // Compare two screenshots to detect changes
    // Would use perceptual hashing or structural similarity
    
    this.logger.log('Comparing screenshots...');
    
    // Placeholder - always return not similar for demo
    return {
      similar: false,
      differenceScore: 0.5,
    };
  }
}
