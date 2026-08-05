export function isRecoverablePrismaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: string }).code?.toLowerCase();
  const message = error instanceof Error ? error.message : String(error);
  const text = `${code ?? ""}\n${message}`.toLowerCase();

  if (code && ["p2021", "p2022", "p2016", "p2023", "p2024", "p2025", "p2026"].includes(code)) {
    return true;
  }

  return /does not exist|table|column|relation|not found|missing|unknown field/i.test(text);
}
