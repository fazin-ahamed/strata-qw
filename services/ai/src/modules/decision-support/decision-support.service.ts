import { Injectable } from '@nestjs/common';
import { LLMProvider } from '../../providers/llm.provider';

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  risks: string[];
  estimatedImpact: number;
  confidence: number;
  resourcesRequired?: string[];
  timeToImplement?: string;
}

export interface DecisionRequest {
  question: string;
  context: string;
  constraints?: string[];
  criteria?: Array<{
    name: string;
    weight: number;
    description?: string;
  }>;
  options?: Partial<DecisionOption>[];
}

export interface DecisionAnalysis {
  recommendation: string;
  reasoning: string;
  options: DecisionOption[];
  tradeOffs: Array<{
    factor: string;
    description: string;
    impactOnOptions: Array<{ optionId: string; impact: string }>;
  }>;
  risks: Array<{
    description: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  nextSteps: string[];
  confidenceScore: number;
}

export interface ScenarioSimulation {
  scenario: string;
  assumptions: string[];
  outcomes: Array<{
    metric: string;
    baseline: number;
    projected: number;
    change: number;
    confidence: number;
  }>;
  risks: string[];
  recommendations: string[];
}

@Injectable()
export class DecisionSupportService {
  constructor(private llmProvider: LLMProvider) {}

  async analyzeDecision(request: DecisionRequest): Promise<DecisionAnalysis> {
    const systemMessage = `You are an expert decision analyst.
    Provide balanced, evidence-based decision analysis.
    Consider multiple perspectives and highlight trade-offs clearly.`;

    const prompt = this.buildDecisionPrompt(request);

    const response = await this.llmProvider.generateJSON<DecisionAnalysis>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        properties: {
          recommendation: { type: 'string' },
          reasoning: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                pros: { type: 'array', items: { type: 'string' } },
                cons: { type: 'array', items: { type: 'string' } },
                risks: { type: 'array', items: { type: 'string' } },
                estimatedImpact: { type: 'number' },
                confidence: { type: 'number' },
                resourcesRequired: { type: 'array', items: { type: 'string' } },
                timeToImplement: { type: 'string' },
              },
            },
          },
          tradeOffs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                factor: { type: 'string' },
                description: { type: 'string' },
                impactOnOptions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      optionId: { type: 'string' },
                      impact: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                probability: { type: 'string', enum: ['low', 'medium', 'high'] },
                impact: { type: 'string', enum: ['low', 'medium', 'high'] },
                mitigation: { type: 'string' },
              },
            },
          },
          nextSteps: { type: 'array', items: { type: 'string' } },
          confidenceScore: { type: 'number' },
        },
        required: ['recommendation', 'reasoning', 'options', 'tradeOffs', 'risks', 'nextSteps', 'confidenceScore'],
      },
    });

    return response;
  }

  private buildDecisionPrompt(request: DecisionRequest): string {
    let prompt = `Decision Analysis Request\n\n`;
    prompt += `Question: ${request.question}\n\n`;
    prompt += `Context:\n${request.context}\n\n`;

    if (request.constraints && request.constraints.length > 0) {
      prompt += `Constraints:\n`;
      request.constraints.forEach((c, i) => {
        prompt += `${i + 1}. ${c}\n`;
      });
      prompt += `\n`;
    }

    if (request.criteria && request.criteria.length > 0) {
      prompt += `Decision Criteria:\n`;
      request.criteria.forEach(c => {
        const weightStr = c.weight ? ` (weight: ${c.weight})` : '';
        prompt += `- ${c.name}${weightStr}`;
        if (c.description) prompt += `: ${c.description}`;
        prompt += `\n`;
      });
      prompt += `\n`;
    }

    if (request.options && request.options.length > 0) {
      prompt += `Consider these options (analyze and expand as needed):\n`;
      request.options.forEach((opt, i) => {
        prompt += `\nOption ${i + 1}: ${opt.title || 'Unnamed'}\n`;
        if (opt.description) prompt += `Description: ${opt.description}\n`;
      });
      prompt += `\n`;
    } else {
      prompt += `Generate and analyze potential options.\n\n`;
    }

    prompt += `Provide comprehensive analysis including:\n`;
    prompt += `1. Clear recommendation with reasoning\n`;
    prompt += `2. Detailed option comparison (pros, cons, risks)\n`;
    prompt += `3. Key trade-offs between options\n`;
    prompt += `4. Risk assessment with mitigations\n`;
    prompt += `5. Actionable next steps\n`;
    prompt += `6. Confidence score (0-1)`;

    return prompt;
  }

  async simulateScenario(
    baseContext: string,
    scenario: string,
    assumptions: string[]
  ): Promise<ScenarioSimulation> {
    const systemMessage = `You are a strategic planning expert.
    Run realistic scenario simulations based on provided assumptions.
    Be conservative in projections and highlight uncertainties.`;

    const prompt = `Scenario Simulation\n\n`;
    prompt += `Base Context:\n${baseContext}\n\n`;
    prompt += `Scenario: ${scenario}\n\n`;
    prompt += `Assumptions:\n`;
    assumptions.forEach((a, i) => {
      prompt += `${i + 1}. ${a}\n`;
    });
    prompt += `\n`;
    prompt += `Provide:\n`;
    prompt += `1. Key outcome projections with metrics\n`;
    prompt += `2. Associated risks\n`;
    prompt += `3. Strategic recommendations`;

    const response = await this.llmProvider.generateJSON<ScenarioSimulation>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        properties: {
          scenario: { type: 'string' },
          assumptions: { type: 'array', items: { type: 'string' } },
          outcomes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                metric: { type: 'string' },
                baseline: { type: 'number' },
                projected: { type: 'number' },
                change: { type: 'number' },
                confidence: { type: 'number' },
              },
            },
          },
          risks: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
        required: ['scenario', 'assumptions', 'outcomes', 'risks', 'recommendations'],
      },
    });

    return response;
  }

  async generateWhatIfAnalysis(
    currentMetrics: Record<string, number>,
    variableChanges: Array<{
      variable: string;
      change: number;
      changeType: 'absolute' | 'percentage';
    }>
  ): Promise<Record<string, number>> {
    const systemMessage = `You are a business analytics expert.
    Project the impact of variable changes on key metrics.
    Use realistic multipliers and account for second-order effects.`;

    const prompt = `What-If Analysis\n\n`;
    prompt += `Current Metrics:\n${JSON.stringify(currentMetrics, null, 2)}\n\n`;
    prompt += `Proposed Changes:\n`;
    variableChanges.forEach(vc => {
      const sign = vc.change > 0 ? '+' : '';
      const unit = vc.changeType === 'percentage' ? '%' : '';
      prompt += `- ${vc.variable}: ${sign}${vc.change}${unit}\n`;
    });
    prompt += `\n`;
    prompt += `Project the new values for all metrics, accounting for:\n`;
    prompt += `- Direct effects\n`;
    prompt += `- Second-order effects\n`;
    prompt += `- Time delays in impact\n`;
    prompt += `Return only the projected metric values as JSON.`;

    const response = await this.llmProvider.generateJSON<Record<string, number>>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        additionalProperties: { type: 'number' },
      },
    });

    return response;
  }

  async compareOptions(
    options: DecisionOption[],
    criteria: Array<{ name: string; weight: number }>
  ): Promise<{ scores: Record<string, number>; ranking: string[]; analysis: string }> {
    const systemMessage = `You are a decision science expert.
    Perform weighted scoring of options against criteria.
    Be objective and explain score differences clearly.`;

    const prompt = `Option Comparison Analysis\n\n`;
    prompt += `Options:\n`;
    options.forEach((opt, i) => {
      prompt += `\n${i + 1}. ${opt.title}\n`;
      prompt += `Description: ${opt.description}\n`;
      prompt += `Pros: ${opt.pros.join(', ')}\n`;
      prompt += `Cons: ${opt.cons.join(', ')}\n`;
    });
    prompt += `\n\nEvaluation Criteria:\n`;
    criteria.forEach(c => {
      prompt += `- ${c.name} (weight: ${c.weight})\n`;
    });
    prompt += `\n`;
    prompt += `Provide:\n`;
    prompt += `1. Weighted score for each option (0-100)\n`;
    prompt += `2. Ranking from best to worst\n`;
    prompt += `3. Brief analysis explaining the ranking`;

    const response = await this.llmProvider.generateJSON<any>({
      prompt,
      systemMessage,
      schema: {
        type: 'object',
        properties: {
          scores: { type: 'object', additionalProperties: { type: 'number' } },
          ranking: { type: 'array', items: { type: 'string' } },
          analysis: { type: 'string' },
        },
        required: ['scores', 'ranking', 'analysis'],
      },
    });

    return response;
  }
}
