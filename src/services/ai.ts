import { GenerateParams, GeneratedName } from "../types";

export async function generateNames(params: GenerateParams): Promise<Omit<GeneratedName, 'id'>[]> {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const response = await fetch(`${apiBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}
