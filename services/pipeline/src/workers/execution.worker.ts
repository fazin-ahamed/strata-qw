import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { OrchestratorService } from '@strata/orchestrator';

@Processor('action-execution')
export class ExecutionWorker {
  private readonly logger = new Logger(ExecutionWorker.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Process('execute-task')
  async handleTaskExecution(job: Job<any>) {
    const { taskId, actionType, payload, userId, requiresApproval } = job.data;
    this.logger.log(`Executing task:${taskId} action:${actionType}`);
    
    try {
      // Check if approval is required and pending
      if (requiresApproval) {
        const approvalStatus = await this.orchestratorService.checkApprovalStatus(taskId);
        if (!approvalStatus.approved) {
          return { status: 'pending_approval', taskId };
        }
      }
      
      // Execute the action
      const result = await this.orchestratorService.executeAction({
        taskId,
        actionType,
        payload,
        userId,
      });
      
      // Log execution for audit trail
      await this.orchestratorService.logExecution({
        taskId,
        actionType,
        result,
        timestamp: new Date(),
        status: 'completed',
      });
      
      // Trigger follow-up actions if defined
      if (result.followUpActions) {
        for (const followUp of result.followUpActions) {
          await this.orchestratorService.queueAction(followUp);
        }
      }
      
      return { status: 'success', result };
    } catch (error) {
      this.logger.error(`Task execution failed: ${error.message}`);
      
      // Log failure
      await this.orchestratorService.logExecution({
        taskId,
        actionType,
        error: error.message,
        timestamp: new Date(),
        status: 'failed',
      });
      
      // Attempt rollback if reversible
      if (job.data.reversible) {
        await this.orchestratorService.rollback(taskId);
      }
      
      throw error;
    }
  }

  @Process('send-notification')
  async handleNotificationSend(job: Job<any>) {
    const { notificationId, type, recipient, content, channel } = job.data;
    this.logger.log(`Sending ${channel} notification to ${recipient}`);
    
    try {
      const result = await this.orchestratorService.sendNotification({
        notificationId,
        type,
        recipient,
        content,
        channel,
      });
      
      return { status: 'sent', messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Notification send failed: ${error.message}`);
      throw error;
    }
  }

  @Process('sync-external-system')
  async handleExternalSync(job: Job<any>) {
    const { systemType, entityId, syncDirection, data } = job.data;
    this.logger.log(`Syncing with ${systemType} for entity:${entityId}`);
    
    try {
      const result = await this.orchestratorService.syncWithExternal({
        systemType,
        entityId,
        syncDirection,
        data,
      });
      
      return { status: 'success', syncedFields: result.syncedFields };
    } catch (error) {
      this.logger.error(`External sync failed: ${error.message}`);
      throw error;
    }
  }

  @Process('schedule-reminder')
  async handleReminderSchedule(job: Job<any>) {
    const { reminderId, userId, content, scheduledTime, context } = job.data;
    this.logger.log(`Scheduling reminder:${reminderId} for ${scheduledTime}`);
    
    try {
      await this.orchestratorService.scheduleReminder({
        reminderId,
        userId,
        content,
        scheduledTime,
        context,
      });
      
      return { status: 'scheduled', reminderId };
    } catch (error) {
      this.logger.error(`Reminder scheduling failed: ${error.message}`);
      throw error;
    }
  }
}
