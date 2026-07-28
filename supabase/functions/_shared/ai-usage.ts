// Registro de uso/custo de IA (AI Gateway) para o painel Master.
// Preços em USD por 1 milhão de tokens.
const PRICING: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "google/gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "google/gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "google/gemini-3.6-flash": { input: 0.30, output: 2.50 },
  "google/gemini-3.1-flash-lite": { input: 0.10, output: 0.40 },
  "openai/gpt-5-mini": { input: 0.25, output: 2.0 },
  "openai/gpt-5": { input: 1.25, output: 10.0 },
  "openai/gpt-5.6-sol": { input: 1.25, output: 10.0 },
};

const DEFAULT_PRICE = { input: 0.30, output: 2.50 };

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = PRICING[model] ?? DEFAULT_PRICE;
  return (promptTokens / 1_000_000) * p.input +
    (completionTokens / 1_000_000) * p.output;
}

type UsageLike = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null | undefined;

/**
 * Registra o consumo de IA. Nunca lança erro — falhas apenas logam no console.
 */
export async function logAiUsage(opts: {
  functionName: string;
  model: string;
  usage: UsageLike;
  companyId?: string | null;
  reportId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;

    const prompt = opts.usage?.prompt_tokens ?? 0;
    const completion = opts.usage?.completion_tokens ?? 0;
    const total = opts.usage?.total_tokens ?? prompt + completion;

    const res = await fetch(`${url}/rest/v1/ai_usage_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        function_name: opts.functionName,
        model: opts.model,
        prompt_tokens: prompt,
        completion_tokens: completion,
        total_tokens: total,
        cost_usd: Number(estimateCostUsd(opts.model, prompt, completion).toFixed(6)),
        company_id: opts.companyId ?? null,
        report_id: opts.reportId ?? null,
        metadata: opts.metadata ?? {},
      }),
    });
    if (!res.ok) {
      console.error("logAiUsage failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("logAiUsage error:", e);
  }
}
