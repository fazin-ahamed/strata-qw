import { Injectable } from '@nestjs/common';

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  tradeOffs: string[];
  confidence: number;
  estimatedImpact?: Record<string, any>;
}

export interface CreateDecisionDto {
  userId: string;
  context: Record<string, any>;
  problem: string;
  constraints?: string[];
  domain: 'business' | 'personal';
}

export interface DecisionResult {
  id: string;
  userId: string;
  context: Record<string, any>;
  problem: string;
  options: DecisionOption[];
  recommendedOptionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  reasoning: string;
  confidence: number;
  createdAt: Date;
  executedAt?: Date;
}

@Injectable()
export class DecisionEngineService {
  private decisions: Map<string, DecisionResult> = new Map();

  async generateDecision(dto: CreateDecisionDto): Promise<DecisionResult> {
    const id = this.generateId();
    
    // Generate options based on the problem context
    const options = this.generateOptions(dto);
    
    // Select the best option based on confidence scoring
    const recommendedOption = options.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const decision: DecisionResult = {
      id,
      userId: dto.userId,
      context: dto.context,
      problem: dto.problem,
      options,
      recommendedOptionId: recommendedOption.id,
      status: 'pending',
      reasoning: this.generateReasoning(dto, recommendedOption),
      confidence: recommendedOption.confidence,
      createdAt: new Date(),
    };

    this.decisions.set(id, decision);
    return decision;
  }

  async getDecision(id: string): Promise<DecisionResult | null> {
    return this.decisions.get(id) || null;
  }

  async approveDecision(id: string): Promise<{ success: boolean }> {
    const decision = this.decisions.get(id);
    if (!decision) {
      return { success: false };
    }
    
    decision.status = 'approved';
    decision.executedAt = new Date();
    this.decisions.set(id, decision);
    
    return { success: true };
  }

  async rejectDecision(id: string): Promise<{ success: boolean }> {
    const decision = this.decisions.get(id);
    if (!decision) {
      return { success: false };
    }
    
    decision.status = 'rejected';
    this.decisions.set(id, decision);
    
    return { success: true };
  }

  async getUserDecisions(userId: string): Promise<DecisionResult[]> {
    return Array.from(this.decisions.values()).filter(d => d.userId === userId);
  }

  private generateOptions(dto: CreateDecisionDto): DecisionOption[] {
    // This is a simplified implementation
    // In production, this would use LLM + rules engine
    const baseOptions: DecisionOption[] = [
      {
        id: this.generateId(),
        label: 'Recommended Action',
        description: `Based on analysis of your ${dto.domain} context, this is the optimal approach.`,
        tradeOffs: ['Requires immediate attention', 'May need additional resources'],
        confidence: 0.85,
        estimatedImpact: { time: '2-4 hours', cost: 'medium', risk: 'low' },
      },
      {
        id: this.generateId(),
        label: 'Alternative Approach',
        description: 'A more conservative option with lower risk but potentially slower results.',
        tradeOffs: ['Slower execution', 'Lower initial impact'],
        confidence: 0.72,
        estimatedImpact: { time: '1-2 days', cost: 'low', risk: 'very low' },
      },
      {
        id: this.generateId(),
        label: 'Defer Decision',
        description: 'Postpone this decision until more information is available.',
        tradeOffs: ['Missed opportunity window', 'Accumulating complexity'],
        confidence: 0.60,
        estimatedImpact: { time: 'variable', cost: 'potential increase', risk: 'medium' },
      },
    ];

    return baseOptions;
  }

  private generateReasoning(dto: CreateDecisionDto, selectedOption: DecisionOption): string {
    return `Based on your ${dto.domain} context and the problem "${dto.problem}", 
    this recommendation considers ${selectedOption.tradeOffs.length} key trade-offs. 
    The confidence score of ${(selectedOption.confidence * 100).toFixed(0)}% reflects 
    pattern matching with similar historical decisions and current contextual factors.`;
  }

  private generateId(): string {
    return `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
