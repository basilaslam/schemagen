import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Simple in-memory rate limiting for development
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60000 // 1 minute in ms
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window expired
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + window,
    });
    return {
      success: true,
      remaining: limit - 1,
      reset: now + window,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count++;
  return {
    success: true,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}

export async function getClientIp(request: Request): Promise<string> {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of something unique
  return 'unknown';
}
