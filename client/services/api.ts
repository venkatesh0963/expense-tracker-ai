import { Transaction, ParsedTransaction } from "../types";

const API_BASE = "/api";

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch(`${API_BASE}/transactions`);
  if (!response.ok) throw new Error("Failed to fetch transactions");
  return response.json();
};

export const addTransaction = async (data: Omit<Transaction, "id" | "created_at">): Promise<Transaction> => {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to add transaction");
  return response.json();
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
};

export const parseTransaction = async (text: string): Promise<ParsedTransaction> => {
  const response = await fetch(`${API_BASE}/transactions/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to parse transaction");
  return response.json();
};

export async function* streamFinancialAdvice(
  transactions: Transaction[]
) {
  const response = await fetch(`${API_BASE}/advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions }),
  });

  if (!response.ok) {
    throw new Error(`Failed to stream advice: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}
