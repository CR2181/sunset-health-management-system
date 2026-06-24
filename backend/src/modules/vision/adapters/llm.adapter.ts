export const LLM_ADAPTER = Symbol("LLM_ADAPTER");

export interface LlmSummaryInput {
  eventType: string;
  confidence: number;
  location: string;
}

export interface LlmAdapter {
  readonly name: string;
  summarize(input: LlmSummaryInput): Promise<string | null>;
}
