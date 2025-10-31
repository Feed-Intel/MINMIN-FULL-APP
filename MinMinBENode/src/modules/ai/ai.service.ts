import { Injectable } from '@nestjs/common';

import { RunInferenceDto } from './dto/run-inference.dto';

@Injectable()
export class AiService {
  async runInference({ model, payload }: RunInferenceDto) {
    return {
      model,
      payload,
      result: 'TODO: integrate with AI provider or Python microservice',
      processedAt: new Date().toISOString(),
    };
  }
}
