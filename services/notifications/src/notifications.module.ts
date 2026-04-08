import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './services/notification.service';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';
import { SMSProvider } from './providers/sms.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [NotificationService, EmailProvider, PushProvider, SMSProvider],
  exports: [NotificationService],
})
export class NotificationsModule {}
