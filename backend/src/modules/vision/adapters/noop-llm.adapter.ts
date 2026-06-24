import { Injectable } from "@nestjs/common";
import { LlmAdapter, LlmSummaryInput } from "./llm.adapter";

@Injectable()
export class NoopLlmAdapter implements LlmAdapter {
  readonly name = "none";

  async summarize(_input: LlmSummaryInput): Promise<null> {
    return null;
  }
}
