import { Injectable, Logger } from '@nestjs/common';

export interface EnrichmentContext {
  entityId: string;
  entityType: 'person' | 'company' | 'event' | 'transaction';
  existingData: Record<string, any>;
}

export interface EnrichedData {
  entityId: string;
  enrichedFields: Record<string, any>;
  confidenceScores: Record<string, number>;
  sources: string[];
}

@Injectable()
export class EnrichmentProcessor {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  async enrich(context: EnrichmentContext): Promise<EnrichedData> {
    this.logger.log(`Enriching ${context.entityType} entity ${context.entityId}`);

    const enrichedFields: Record<string, any> = {};
    const confidenceScores: Record<string, number> = {};
    const sources: string[] = [];

    // Enrich based on entity type
    switch (context.entityType) {
      case 'person':
        await this.enrichPerson(context, enrichedFields, confidenceScores, sources);
        break;
      case 'company':
        await this.enrichCompany(context, enrichedFields, confidenceScores, sources);
        break;
      case 'event':
        await this.enrichEvent(context, enrichedFields, confidenceScores, sources);
        break;
      case 'transaction':
        await this.enrichTransaction(context, enrichedFields, confidenceScores, sources);
        break;
    }

    return {
      entityId: context.entityId,
      enrichedFields,
      confidenceScores,
      sources,
    };
  }

  private async enrichPerson(
    context: EnrichmentContext,
    enriched: Record<string, any>,
    scores: Record<string, number>,
    sources: string[]
  ): Promise<void> {
    const data = context.existingData;

    // Infer full name if we have first/last
    if (data.firstName && data.lastName && !data.fullName) {
      enriched.fullName = `${data.firstName} ${data.lastName}`.trim();
      scores.fullName = 1.0;
      sources.push('inference');
    }

    // Infer domain from email
    if (data.email && !data.companyDomain) {
      const domain = data.email.split('@')[1];
      if (domain) {
        enriched.companyDomain = domain;
        scores.companyDomain = 0.9;
        sources.push('email_extraction');
      }
    }

    // Normalize phone number
    if (data.phone) {
      enriched.normalizedPhone = this.normalizePhoneNumber(data.phone);
      scores.normalizedPhone = 0.95;
      sources.push('normalization');
    }

    // Infer seniority from title
    if (data.title) {
      enriched.seniorityLevel = this.inferSeniority(data.title);
      scores.seniorityLevel = 0.7;
      sources.push('title_inference');
    }
  }

  private async enrichCompany(
    context: EnrichmentContext,
    enriched: Record<string, any>,
    scores: Record<string, number>,
    sources: string[]
  ): Promise<void> {
    const data = context.existingData;

    // Infer company size from employee count range
    if (data.employeeCount) {
      enriched.sizeCategory = this.categorizeCompanySize(data.employeeCount);
      scores.sizeCategory = 0.95;
      sources.push('employee_count');
    }

    // Infer industry from description or keywords
    if (data.description || data.keywords) {
      enriched.industryTags = this.extractIndustryTags(data.description || '', data.keywords || []);
      scores.industryTags = 0.6;
      sources.push('text_analysis');
    }

    // Normalize website URL
    if (data.website) {
      enriched.normalizedWebsite = this.normalizeUrl(data.website);
      scores.normalizedWebsite = 1.0;
      sources.push('normalization');
    }
  }

  private async enrichEvent(
    context: EnrichmentContext,
    enriched: Record<string, any>,
    scores: Record<string, number>,
    sources: string[]
  ): Promise<void> {
    const data = context.existingData;

    // Calculate event duration if not provided
    if (data.startTime && data.endTime && !data.duration) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      enriched.durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      scores.durationMinutes = 1.0;
      sources.push('calculation');
    }

    // Infer meeting type from title/description
    if (data.title || data.description) {
      const text = (data.title || '') + ' ' + (data.description || '');
      enriched.meetingType = this.classifyMeetingType(text);
      scores.meetingType = 0.65;
      sources.push('classification');
    }

    // Determine time of day
    if (data.startTime) {
      enriched.timeOfDay = this.getTimeOfDay(new Date(data.startTime));
      scores.timeOfDay = 1.0;
      sources.push('time_analysis');
    }
  }

  private async enrichTransaction(
    context: EnrichmentContext,
    enriched: Record<string, any>,
    scores: Record<string, number>,
    sources: string[]
  ): Promise<void> {
    const data = context.existingData;

    // Categorize transaction amount
    if (data.amount !== undefined) {
      enriched.amountCategory = this.categorizeAmount(data.amount);
      scores.amountCategory = 1.0;
      sources.push('amount_analysis');
    }

    // Extract merchant info from description
    if (data.description) {
      enriched.merchantInfo = this.extractMerchantInfo(data.description);
      scores.merchantInfo = 0.7;
      sources.push('text_extraction');
    }

    // Determine recurring pattern likelihood
    if (data.description && data.amount) {
      enriched.isLikelyRecurring = this.detectRecurringPattern(data.description, data.amount);
      scores.isLikelyRecurring = 0.5;
      sources.push('pattern_detection');
    }
  }

  // Helper methods
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle US numbers
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    return phone;
  }

  private inferSeniority(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('ceo') || lowerTitle.includes('founder') || lowerTitle.includes('president')) {
      return 'c_level';
    } else if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) {
      return 'vp_level';
    } else if (lowerTitle.includes('director')) {
      return 'director';
    } else if (lowerTitle.includes('manager')) {
      return 'manager';
    } else if (lowerTitle.includes('senior')) {
      return 'senior';
    }
    
    return 'individual_contributor';
  }

  private categorizeCompanySize(employeeCount: number): string {
    if (employeeCount < 10) return 'micro';
    if (employeeCount < 50) return 'small';
    if (employeeCount < 250) return 'medium';
    if (employeeCount < 1000) return 'large';
    return 'enterprise';
  }

  private extractIndustryTags(description: string, keywords: string[]): string[] {
    const commonIndustries = ['tech', 'finance', 'healthcare', 'retail', 'manufacturing', 'education'];
    const text = (description + ' ' + keywords.join(' ')).toLowerCase();
    
    return commonIndustries.filter(industry => text.includes(industry));
  }

  private normalizeUrl(url: string): string {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  }

  private classifyMeetingType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('interview')) return 'interview';
    if (lowerText.includes('demo') || lowerText.includes('presentation')) return 'demo';
    if (lowerText.includes('standup') || lowerText.includes('daily')) return 'standup';
    if (lowerText.includes('review') || lowerText.includes('retro')) return 'review';
    if (lowerText.includes('planning') || lowerText.includes('strategy')) return 'planning';
    if (lowerText.includes('1:1') || lowerText.includes('one-on-one')) return 'one_on_one';
    
    return 'general';
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private categorizeAmount(amount: number): string {
    if (amount < 100) return 'micro';
    if (amount < 1000) return 'small';
    if (amount < 10000) return 'medium';
    if (amount < 100000) return 'large';
    return 'enterprise';
  }

  private extractMerchantInfo(description: string): { name?: string; category?: string } {
    // Simple extraction - in production would use NER model
    const words = description.split(' ').filter(w => w.length > 3);
    return {
      name: words[0] || undefined,
    };
  }

  private detectRecurringPattern(description: string, amount: number): boolean {
    const recurringKeywords = ['subscription', 'monthly', 'annual', 'recurring', 'auto-renew'];
    const lowerDesc = description.toLowerCase();
    
    return recurringKeywords.some(keyword => lowerDesc.includes(keyword));
  }
}
