import { Injectable } from '@nestjs/common';
import { LLMProvider } from '../../providers/llm.provider';

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  actionRequired?: boolean;
  suggestedAction?: string;
  urgency: 'low' | 'medium' | 'high';
  category: 'commitment' | 'question' | 'task' | 'information' | 'decision' | 'follow_up';
}

export interface CommitmentExtraction {
  commitments: Array<{
    description: string;
    owner: string;
    dueDate?: Date;
    confidence: number;
    context: string;
  }>;
}

@Injectable()
export class IntentService {
  constructor(private llmProvider: LLMProvider) {}

  async detectIntent(text: string, context?: string): Promise<IntentDetectionResult> {
    const systemMessage = `You are an intent detection engine for Strata platform.
    Analyze communications to extract intents, entities, and required actions.
    Be precise and conservative with confidence scores.`;

    const prompt = `Analyze the following text and extract:\n`;
    prompt += `1. Primary intent (what does the sender want?)\n`;
    prompt += `2. Key entities (people, dates, amounts, objects)\n`;
    prompt += `3. Whether action is required\n`;
    prompt += `4. Suggested action if any\n`;
    prompt += `5. Urgency level\n`;
    prompt += `6. Category (commitment, question, task, information, decision, follow_up)\n\n`;
    
    if (context) {
      prompt += `Context: ${context}\n\n`;
    }
    
    prompt += `Text to analyze:\n${text}`;

    const response = await this.llmProvider.generateJSON<IntentDetectionResult>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          confidence: { type: 'number' },
          entities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                value: { type: 'string' },
                confidence: { type: 'number' },
              },
            },
          },
          actionRequired: { type: 'boolean' },
          suggestedAction: { type: 'string' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
          category: { 
            type: 'string', 
            enum: ['commitment', 'question', 'task', 'information', 'decision', 'follow_up'] 
          },
        },
        required: ['intent', 'confidence', 'entities', 'urgency', 'category'],
      },
    });

    return response;
  }

  async extractCommitments(text: string, participants?: string[]): Promise<CommitmentExtraction> {
    const systemMessage = `You are a commitment extraction specialist.
    Identify explicit and implicit commitments in conversations.
    A commitment is any promise, obligation, or agreed-upon action.`;

    const prompt = `Extract all commitments from the following text.\n`;
    prompt += `For each commitment, identify:\n`;
    prompt += `- What is committed\n`;
    prompt += `- Who is responsible (owner)\n`;
    prompt += `- When it's due (if mentioned)\n`;
    prompt += `- Confidence in extraction\n`;
    prompt += `- Context around the commitment\n\n`;

    if (participants && participants.length > 0) {
      prompt += `Participants: ${participants.join(', ')}\n\n`;
    }

    prompt += `Text:\n${text}`;

    const response = await this.llmProvider.generateJSON<CommitmentExtraction>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        properties: {
          commitments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                owner: { type: 'string' },
                dueDate: { type: 'string', format: 'date-time' },
                confidence: { type: 'number' },
                context: { type: 'string' },
              },
            },
          },
        },
        required: ['commitments'],
      },
    });

    // Parse date strings to Date objects
    response.commitments.forEach(c => {
      if (c.dueDate && typeof c.dueDate === 'string') {
        c.dueDate = new Date(c.dueDate);
      }
    });

    return response;
  }

  async classifyEmail(email: {
    subject: string;
    body: string;
    sender: string;
    recipients: string[];
  }): Promise<IntentDetectionResult> {
    const text = `Subject: ${email.subject}\n\nFrom: ${email.sender}\n\nTo: ${email.recipients.join(', ')}\n\n${email.body}`;
    return this.detectIntent(text);
  }

  async analyzeConversationTurn(
    message: string,
    conversationHistory: string[]
  ): Promise<IntentDetectionResult & { sentiment?: string; topic?: string }> {
    const systemMessage = `Analyze a single turn in a conversation.
    Consider the context from previous messages.`;

    const prompt = `Analyze this message in the context of the conversation:\n\n`;
    prompt += `Conversation History:\n${conversationHistory.slice(-5).join('\n---\n')}\n\n`;
    prompt += `Current Message:\n${message}\n\n`;
    prompt += `Provide intent analysis plus:\n`;
    prompt += `- Sentiment (positive, neutral, negative)\n`;
    prompt += `- Main topic being discussed`;

    const response = await this.llmProvider.generateJSON<any>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          confidence: { type: 'number' },
          entities: { type: 'array' },
          actionRequired: { type: 'boolean' },
          suggestedAction: { type: 'string' },
          urgency: { type: 'string' },
          category: { type: 'string' },
          sentiment: { type: 'string' },
          topic: { type: 'string' },
        },
      },
    });

    return response;
  }

  async suggestFollowUp(message: string, intent: IntentDetectionResult): Promise<string> {
    if (!intent.actionRequired) {
      return '';
    }

    const systemMessage = 'Draft a concise, professional follow-up response based on the detected intent.';

    const prompt = `Based on this message and its intent, draft an appropriate follow-up:\n\n`;
    prompt += `Original Message:\n${message}\n\n`;
    prompt += `Detected Intent:\n${JSON.stringify(intent, null, 2)}\n\n`;
    prompt += `Draft a response that:\n`;
    prompt += `- Acknowledges the request/concern\n`;
    prompt += `- Confirms next steps if action is needed\n`;
    prompt += `- Is concise and professional\n`;
    prompt += `- Matches the tone of the original message`;

    const response = await this.llmProvider.generate({
      prompt,
      systemMessage,
    });

    return response.content;
  }
}
