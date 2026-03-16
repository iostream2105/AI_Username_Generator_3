import { GenerateParams, GeneratedName } from "../types";

export async function generateNames(params: GenerateParams): Promise<Omit<GeneratedName, 'id'>[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}
