import { Injectable } from '@nestjs/common';
import { LLMProvider, LLMRequest } from '../../providers/llm.provider';

export interface NarrativeContext {
  entityType: 'business' | 'personal';
  dataPoints: Array<{
    metric: string;
    value: number | string;
    change?: number;
    period: string;
  }>;
  anomalies?: Array<{
    metric: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface NarrativeResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  keyMetrics: string[];
}

@Injectable()
export class NarrativeService {
  constructor(private llmProvider: LLMProvider) {}

  async generateNarrative(context: NarrativeContext): Promise<NarrativeResult> {
    const systemMessage = `You are an intelligent business/personal analytics assistant. 
    Generate clear, actionable narratives from data. Focus on insights that drive decisions.`;

    const prompt = this.buildNarrativePrompt(context);

    const response = await this.llmProvider.generateJSON<NarrativeResult>({
      prompt,
      systemMessage,
      context: JSON.stringify(context),
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          insights: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          keyMetrics: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    return response;
  }

  private buildNarrativePrompt(context: NarrativeContext): string {
    const entityType = context.entityType === 'business' ? 'Business' : 'Personal';
    
    let prompt = `${entityType} Performance Analysis\n\n`;
    prompt += `Time Period: ${context.timeRange.start.toISOString()} to ${context.timeRange.end.toISOString()}\n\n`;
    
    prompt += `Key Metrics:\n`;
    context.dataPoints.forEach(dp => {
      const changeStr = dp.change ? ` (${dp.change > 0 ? '+' : ''}${dp.change}%)` : '';
      prompt += `- ${dp.metric}: ${dp.value}${changeStr}\n`;
    });

    if (context.anomalies && context.anomalies.length > 0) {
      prompt += `\nNotable Anomalies:\n`;
      context.anomalies.forEach(anomaly => {
        prompt += `- [${anomaly.severity.toUpperCase()}] ${anomaly.metric}: ${anomaly.description}\n`;
      });
    }

    prompt += `\nGenerate a concise narrative with:\n`;
    prompt += `1. A 2-3 sentence executive summary\n`;
    prompt += `2. 3-5 key insights\n`;
    prompt += `3. 2-3 actionable recommendations\n`;
    prompt += `4. List of most important metrics to track`;

    return prompt;
  }

  async generateMeetingSummary(transcript: string, participants: string[]): Promise<string> {
    const systemMessage = 'You are an expert meeting analyst. Extract key decisions, action items, and insights.';

    const prompt = `Analyze this meeting transcript and provide:\n`;
    prompt += `- Executive summary (2-3 sentences)\n`;
    prompt += `- Key decisions made\n`;
    prompt += `- Action items with owners\n`;
    prompt += `- Follow-up topics\n\n`;
    prompt += `Participants: ${participants.join(', ')}\n\n`;
    prompt += `Transcript:\n${transcript}`;

    const response = await this.llmProvider.generate({
      prompt,
      systemMessage,
    });

    return response.content;
  }

  async generateDailyBriefing(
    entityType: 'business' | 'personal',
    tasks: any[],
    events: any[],
    priorities: any[]
  ): Promise<string> {
    const systemMessage = `You are a ${entityType === 'business' ? 'business' : 'personal'} productivity assistant. 
    Create focused, actionable daily briefings.`;

    const prompt = `Create a daily briefing for ${entityType === 'business' ? 'business operations' : 'personal life'}:\n\n`;
    prompt += `Today's Events:\n${JSON.stringify(events)}\n\n`;
    prompt += `Pending Tasks:\n${JSON.stringify(tasks)}\n\n`;
    prompt += `Priority Items:\n${JSON.stringify(priorities)}\n\n`;
    prompt += `Structure the briefing as:\n`;
    prompt += `1. Good morning opener\n`;
    prompt += `2. Top 3 priorities for today\n`;
    prompt += `3. Schedule overview\n`;
    prompt += `4. Quick wins available\n`;
    prompt += `5. Potential challenges to anticipate`;

    const response = await this.llmProvider.generate({
      prompt,
      systemMessage,
    });

    return response.content;
  }
}
