import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrchestratorService, CreateTaskDto, Task } from './orchestrator.service';

@Controller()
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get('health')
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('tasks')
  async createTask(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.orchestratorService.createTask(createTaskDto);
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string): Promise<Task | null> {
    return this.orchestratorService.getTask(id);
  }

  @Get('users/:userId/tasks')
  async getUserTasks(@Param('userId') userId: string): Promise<Task[]> {
    return this.orchestratorService.getUserTasks(userId);
  }

  @Post('tasks/:id/execute')
  async executeTask(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.orchestratorService.executeTask(id);
  }

  @Post('tasks/:id/cancel')
  async cancelTask(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.orchestratorService.cancelTask(id);
  }
}
