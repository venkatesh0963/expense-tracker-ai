import { Router, type Request, type Response } from "express";
import { generateObject, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import {
  insertTransaction,
  getAllTransactions,
  deleteTransaction,
  type TransactionRow,
} from "../db.js";

const router = Router();

// GET /api/transactions
router.get("/transactions", (_req: Request, res: Response) => {
  const transactions = getAllTransactions();
  res.json(transactions);
});

// POST /api/transactions
router.post("/transactions", (req: Request, res: Response) => {
  const { type, amount, category, description, date } = req.body;
  
  if (!type || typeof amount !== "number" || !category || !description || !date) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const tx: TransactionRow = {
    id: crypto.randomUUID(),
    type,
    amount,
    category,
    description,
    date,
    created_at: Date.now(),
  };

  insertTransaction(tx);
  res.json(tx);
});

// DELETE /api/transactions/:id
router.delete("/transactions/:id", (req: Request, res: Response) => {
  deleteTransaction(req.params.id);
  res.json({ success: true });
});

// POST /api/transactions/parse
router.post("/transactions/parse", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Text is required" });
    return;
  }

  try {
    const transactionSchema = z.object({
      type: z.enum(["income", "expense"]).describe("Whether this is money coming in (income) or going out (expense)"),
      amount: z.number().describe("The numerical amount extracted"),
      category: z.string().describe("Categorize the transaction. e.g., Food, Transport, Salary, Entertainment, Utilities, Rent, etc. Use common capitalization."),
      description: z.string().describe("A concise description of what the transaction was for")
    });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: transactionSchema,
      prompt: `Extract the financial transaction details from the following text: "${text}". 
      Assume the currency is standard (like USD) if not specified, but return the absolute numerical value. 
      If it sounds like an expense (bought, paid, spent, subscribed), mark as 'expense'. 
      If it sounds like income (earned, received, sold, salary), mark as 'income'.`,
    });

    res.json(object);
  } catch (error) {
    console.error("Error parsing transaction:", error);
    res.status(500).json({ error: "Failed to parse transaction" });
  }
});

// POST /api/advice
router.post("/advice", async (req: Request, res: Response) => {
  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions)) {
    res.status(400).json({ error: "Transactions array is required" });
    return;
  }

  // Create a summary for the AI
  let income = 0;
  let expense = 0;
  const categories: Record<string, number> = {};

  transactions.forEach((tx: any) => {
    if (tx.type === "income") income += tx.amount;
    else {
      expense += tx.amount;
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    }
  });

  const summary = `
    Total Income: $${income}
    Total Expenses: $${expense}
    Net Balance: $${income - expense}
    
    Expense Breakdown by Category:
    ${Object.entries(categories).map(([k, v]) => `- ${k}: $${v}`).join("\n")}
  `;

  const prompt = `You are an expert AI financial advisor. Based on the following summary of the user's recent transactions, provide concise, actionable, and encouraging financial advice.
  Highlight areas where they are doing well, and gently suggest areas where they could cut back or improve.

  Financial Summary:
  ${summary}
  
  Format your advice in clean markdown.`;

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    // Set up streaming response
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders();

    for await (const chunk of result.textStream) {
      res.write(chunk);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }
    res.end();
  } catch (error) {
    console.error("Error generating advice:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate advice" });
    } else {
      res.end();
    }
  }
});

export default router;
