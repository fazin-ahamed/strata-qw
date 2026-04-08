import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionProcessor } from './processors/transcription.processor';
import { SpeakerDiarizationService } from './processors/speaker-diarization.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [TranscriptionProcessor, SpeakerDiarizationService],
  exports: [TranscriptionProcessor, SpeakerDiarizationService],
})
export class TranscriptionModule {}
