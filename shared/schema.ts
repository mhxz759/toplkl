import { pgTable, text, serial, integer, boolean, timestamp, numeric, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// === TRANSACTIONS ===
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0").notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  externalId: text("external_id"), // MisticPay transaction ID
  paymentMethod: text("payment_method"), // 'pix', 'crypto'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SETTINGS (For Admin Fees) ===
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., 'admin_fees_balance'
  value: decimal("value", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, joinedAt: true, balance: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// API Types
export type ApproveUserRequest = { userId: number; approved: boolean };
export type StatsResponse = {
  totalUsers: number;
  pendingUsers: number;
  totalFees: number;
};
