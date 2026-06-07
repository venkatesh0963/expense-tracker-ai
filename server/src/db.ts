import { Database } from "bun:sqlite";

const db = new Database("expense-tracker.db", { create: true });

// Enable WAL mode for better concurrent reads
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    date INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export interface TransactionRow {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: number;
  created_at: number;
}

export function getAllTransactions(): TransactionRow[] {
  return db.query("SELECT * FROM transactions ORDER BY date DESC, created_at DESC").all() as TransactionRow[];
}

export function insertTransaction(tx: TransactionRow): void {
  db.query("INSERT INTO transactions (id, type, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(tx.id, tx.type, tx.amount, tx.category, tx.description, tx.date, tx.created_at);
}

export function deleteTransaction(id: string): void {
  db.query("DELETE FROM transactions WHERE id = ?").run(id);
}

export default db;
