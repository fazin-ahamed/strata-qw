import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DecisionEngineService, CreateDecisionDto, DecisionResult } from './decision-engine.service';

@Controller()
export class DecisionEngineController {
  constructor(private readonly decisionEngineService: DecisionEngineService) {}

  @Get('health')
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('decisions')
  async createDecision(@Body() createDecisionDto: CreateDecisionDto): Promise<DecisionResult> {
    return this.decisionEngineService.generateDecision(createDecisionDto);
  }

  @Get('decisions/:id')
  async getDecision(@Param('id') id: string): Promise<DecisionResult | null> {
    return this.decisionEngineService.getDecision(id);
  }

  @Post('decisions/:id/approve')
  async approveDecision(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.decisionEngineService.approveDecision(id);
  }

  @Post('decisions/:id/reject')
  async rejectDecision(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.decisionEngineService.rejectDecision(id);
  }

  @Get('users/:userId/decisions')
  async getUserDecisions(@Param('userId') userId: string): Promise<DecisionResult[]> {
    return this.decisionEngineService.getUserDecisions(userId);
  }
}
