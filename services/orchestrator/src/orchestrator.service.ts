import { Injectable } from '@nestjs/common';

export interface CreateTaskDto {
  userId: string;
  type: string;
  payload: Record<string, any>;
  decisionId?: string;
  scheduledAt?: Date;
}

export interface Task {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  decisionId?: string;
  scheduledAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class OrchestratorService {
  private tasks: Map<string, Task> = new Map();

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const id = this.generateId();
    
    const task: Task = {
      id,
      userId: dto.userId,
      type: dto.type,
      payload: dto.payload,
      status: dto.scheduledAt && dto.scheduledAt > new Date() ? 'pending' : 'pending',
      decisionId: dto.decisionId,
      scheduledAt: dto.scheduledAt,
      retryCount: 0,
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    
    // Auto-execute if not scheduled for future
    if (!dto.scheduledAt || dto.scheduledAt <= new Date()) {
      setTimeout(() => this.executeTask(id), 0);
    }

    return task;
  }

  async getTask(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.userId === userId);
  }

  async executeTask(id: string): Promise<{ success: boolean }> {
    const task = this.tasks.get(id);
    if (!task) {
      return { success: false };
    }

    if (task.status === 'completed' || task.status === 'running') {
      return { success: false };
    }

    task.status = 'running';
    this.tasks.set(id, task);

    try {
      // Execute the task based on type
      const result = await this.executeTaskByType(task);
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      this.tasks.set(id, task);
      
      return { success: true };
    } catch (error: any) {
      task.retryCount++;
      
      if (task.retryCount >= 3) {
        task.status = 'failed';
        task.errorMessage = error.message;
        this.tasks.set(id, task);
        return { success: false };
      }
      
      // Retry
      setTimeout(() => this.executeTask(id), 1000 * task.retryCount);
      return { success: true };
    }
  }

  async cancelTask(id: string): Promise<{ success: boolean }> {
    const task = this.tasks.get(id);
    if (!task) {
      return { success: false };
    }

    if (task.status === 'completed' || task.status === 'running') {
      return { success: false };
    }

    task.status = 'cancelled';
    this.tasks.set(id, task);
    
    return { success: true };
  }

  private async executeTaskByType(task: Task): Promise<Record<string, any>> {
    // Task execution logic based on type
    switch (task.type) {
      case 'send_notification':
        return this.executeNotificationTask(task);
      case 'sync_data':
        return this.executeSyncTask(task);
      case 'create_event':
        return this.executeCreateEventTask(task);
      case 'send_email':
        return this.executeEmailTask(task);
      default:
        return { executed: true, type: task.type };
    }
  }

  private async executeNotificationTask(task: Task): Promise<Record<string, any>> {
    // Send notification logic
    return { sent: true, taskId: task.id };
  }

  private async executeSyncTask(task: Task): Promise<Record<string, any>> {
    // Sync data logic
    return { synced: true, itemsSynced: 0 };
  }

  private async executeCreateEventTask(task: Task): Promise<Record<string, any>> {
    // Create calendar event logic
    return { created: true, eventId: this.generateId() };
  }

  private async executeEmailTask(task: Task): Promise<Record<string, any>> {
    // Send email logic
    return { sent: true, messageId: this.generateId() };
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
