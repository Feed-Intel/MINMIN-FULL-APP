import { Body, Controller, Post } from '@nestjs/common';

import { AiService } from './ai.service';
import { RunInferenceDto } from './dto/run-inference.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('inference')
  runInference(@Body() payload: RunInferenceDto) {
    return this.aiService.runInference(payload);
  }
}
