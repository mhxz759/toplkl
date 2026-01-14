import { z } from 'zod';
import { users, transactions } from './schema';

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    approve: {
      method: 'POST' as const,
      path: '/api/users/:id/approve',
      input: z.object({ approved: z.boolean() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalUsers: z.number(),
          pendingUsers: z.number(),
          totalFees: z.number(),
        }),
      },
    },
  },
  admin: {
    withdrawFees: {
      method: 'POST' as const,
      path: '/api/admin/withdraw-fees',
      input: z.object({ pixKey: z.string(), pixKeyType: z.string() }),
      responses: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
