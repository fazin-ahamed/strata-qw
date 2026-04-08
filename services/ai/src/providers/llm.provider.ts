import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export interface LLMRequest {
  prompt: string;
  context?: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class LLMProvider {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const systemMessage = request.systemMessage || 'You are a helpful AI assistant for Strata platform.';
    
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage],
      ['human', '{input}'],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const input = request.context 
      ? `${request.context}\n\nQuery: ${request.prompt}`
      : request.prompt;

    const result = await chain.invoke({ input });

    return {
      content: result,
    };
  }

  async generateWithHistory(request: LLMRequest & { history?: Array<{role: string, content: string}> }): Promise<LLMResponse> {
    const systemMessage = request.systemMessage || 'You are a helpful AI assistant for Strata platform.';
    
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage],
      ...(request.history || []).map(h => [h.role as any, h.content] as [any, string]),
      ['human', '{input}'],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const input = request.context 
      ? `${request.context}\n\nQuery: ${request.prompt}`
      : request.prompt;

    const result = await chain.invoke({ input });

    return {
      content: result,
    };
  }

  async generateJSON<T>(request: LLMRequest & { schema: any }): Promise<T> {
    const result = await this.generate({
      ...request,
      systemMessage: `${request.systemMessage || ''} Respond ONLY with valid JSON matching the requested schema.`,
    });

    try {
      return JSON.parse(result.content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }
}
