import { Module, Controller, Post, Body, Get, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisualProcessorService } from './visual-processor.service';

export interface AnalyzeVisualRequest {
  image: string; // base64
  context?: any;
}

export interface UploadVisualRequest {
  meetingId: string;
  image: string; // base64
  snippetId: string;
}

@Controller('ai')
export class VisualAnalysisController {
  constructor(private readonly visualService: VisualProcessorService) {}

  @Post('analyze-visual')
  async analyzeVisual(@Body() request: AnalyzeVisualRequest) {
    const result = await this.visualService.analyzeRelevance(
      request.image,
      request.context
    );
    return result;
  }
}

@Controller('storage')
export class VisualStorageController {
  constructor(private readonly visualService: VisualProcessorService) {}

  @Post('upload-visual')
  async uploadVisual(@Body() request: UploadVisualRequest) {
    const url = await this.visualService.storeImage(
      request.meetingId,
      request.image,
      request.snippetId
    );
    return { url };
  }

  @Delete('visual/:snippetId')
  async deleteVisual(@Param('snippetId') snippetId: string) {
    await this.visualService.deleteImage(snippetId);
    return { success: true };
  }
}

@Controller('visual-snippets')
export class VisualSnippetsController {
  constructor(private readonly visualService: VisualProcessorService) {}

  @Post()
  async saveSnippet(@Body() body: any) {
    const snippet = await this.visualService.saveMetadata(body);
    return snippet;
  }

  @Get('pending')
  async getPendingSnippets() {
    return this.visualService.getPendingSnippets();
  }

  @Post(':snippetId/approve')
  async approveSnippet(@Param('snippetId') snippetId: string) {
    const snippet = await this.visualService.approveSnippet(snippetId);
    return snippet;
  }

  @Post(':snippetId/reject')
  async rejectSnippet(@Param('snippetId') snippetId: string) {
    await this.visualService.rejectSnippet(snippetId);
    return { success: true };
  }
}

@Module({
  imports: [],
  controllers: [VisualAnalysisController, VisualStorageController, VisualSnippetsController],
  providers: [VisualProcessorService],
})
export class VisualProcessorModule {}
