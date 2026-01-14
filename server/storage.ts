import { users, transactions, settings, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>; // Add/Subtract
  updateUserApproval(userId: number, approved: boolean): Promise<User>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  getUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  
  getStats(): Promise<{ totalUsers: number; pendingUsers: number; totalFees: number }>;
  
  updateAdminFees(amount: number): Promise<void>;
  getAdminFees(): Promise<number>;
  resetAdminFees(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}`
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserApproval(userId: number, approved: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isApproved: approved })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    await db.update(transactions).set({ status }).where(eq(transactions.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.joinedAt));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isApproved, false));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getStats() {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isApproved, false));
    const [fees] = await db.select().from(settings).where(eq(settings.key, 'admin_fees_balance'));
    
    return {
      totalUsers: Number(userCount?.count || 0),
      pendingUsers: Number(pendingCount?.count || 0),
      totalFees: Number(fees?.value || 0),
    };
  }

  async updateAdminFees(amount: number): Promise<void> {
    const [existing] = await db.select().from(settings).where(eq(settings.key, 'admin_fees_balance'));
    if (existing) {
      await db.update(settings)
        .set({ value: sql`${settings.value} + ${amount}` })
        .where(eq(settings.key, 'admin_fees_balance'));
    } else {
      await db.insert(settings).values({ key: 'admin_fees_balance', value: amount.toString() });
    }
  }

  async getAdminFees(): Promise<number> {
    const [fees] = await db.select().from(settings).where(eq(settings.key, 'admin_fees_balance'));
    return Number(fees?.value || 0);
  }

  async resetAdminFees(): Promise<void> {
    await db.update(settings).set({ value: "0" }).where(eq(settings.key, 'admin_fees_balance'));
  }
}

export const storage = new DatabaseStorage();
