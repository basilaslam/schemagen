import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { SavedSchema } from '@/types/schema';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateSchema, validateSchemaId } from '@/lib/validation';
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  DatabaseError,
  isAppError,
} from '@/lib/errors';
import { logger, logRequest, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RATE_LIMIT = 20; // 20 requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip = await getClientIp(req);
  const userAgent = req.headers.get('user-agent') || undefined;

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(`POST:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      const error = new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      logError(error, 'POST', '/api/schemas', undefined, 429, { ip });
      throw error;
    }

    const { userId } = await auth();

    if (!userId) {
      const error = new UnauthorizedError();
      logError(error, 'POST', '/api/schemas', undefined, 401, { ip });
      throw error;
    }

    const body = await req.json();

    // Validate schema data
    const validation = validateSchema(body);

    if (!validation.success) {
      const error = new ValidationError('Invalid schema data', validation.errors);
      logError(error, 'POST', '/api/schemas', userId, 400, { ip });
      throw error;
    }

    const { dynamic = false } = body;

    const schemaId = nanoid(10);
    const savedSchema = {
      ...validation.data,
      schemaId,
      dynamic,
      userId,
      createdAt: new Date(),
    };

    const db = await getDb();

    try {
      // Use any to bypass type check for _id field - MongoDB will handle it
      await db.collection('schemas').insertOne(savedSchema as any);
    } catch (dbError) {
      const error = new DatabaseError('Failed to save schema to database', dbError);
      logError(error, 'POST', '/api/schemas', userId, 500, { ip });
      throw error;
    }

    const duration = Date.now() - startTime;
    logRequest('POST', '/api/schemas', userId, 201, duration, { ip, schemaId });

    return NextResponse.json({
      success: true,
      schemaId,
      dynamic,
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving schema:', error);

    if (isAppError(error)) {
      const response: any = {
        success: false,
        error: error.message,
        code: error.code,
      };

      if (error.details) {
        response.details = error.details;
      }

      if (error instanceof RateLimitError && error.retryAfter) {
        response.retryAfter = error.retryAfter;
      }

      return NextResponse.json(response, { status: error.statusCode });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const ip = await getClientIp(req);

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(`GET:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      const error = new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      logError(error, 'GET', '/api/schemas', undefined, 429, { ip });
      throw error;
    }

    const { userId } = await auth();

    if (!userId) {
      const error = new UnauthorizedError();
      logError(error, 'GET', '/api/schemas', undefined, 401, { ip });
      throw error;
    }

    const searchParams = req.nextUrl.searchParams;
    const schemaId = searchParams.get('id');

    // Validate schema ID
    const idValidation = validateSchemaId(schemaId);

    if (!schemaId || !idValidation.success) {
      const error = new ValidationError(idValidation.error || 'Schema ID required');
      logError(error, 'GET', '/api/schemas', userId, 400, { ip, schemaId });
      throw error;
    }

    const db = await getDb();

    let schema: SavedSchema | null;
    try {
      schema = await db.collection('schemas').findOne({
        schemaId,
        userId,
      }) as SavedSchema | null;
    } catch (dbError) {
      const error = new DatabaseError('Failed to fetch schema from database', dbError);
      logError(error, 'GET', '/api/schemas', userId, 500, { ip, schemaId });
      throw error;
    }

    if (!schema) {
      const error = new NotFoundError('Schema', schemaId);
      logError(error, 'GET', '/api/schemas', userId, 404, { ip, schemaId });
      throw error;
    }

    const duration = Date.now() - startTime;
    logRequest('GET', '/api/schemas', userId, 200, duration, { ip, schemaId });

    return NextResponse.json({ success: true, schema });
  } catch (error) {
    console.error('Error fetching schema:', error);

    if (isAppError(error)) {
      const response: any = {
        success: false,
        error: error.message,
        code: error.code,
      };

      if (error.details) {
        response.details = error.details;
      }

      if (error instanceof RateLimitError && error.retryAfter) {
        response.retryAfter = error.retryAfter;
      }

      return NextResponse.json(response, { status: error.statusCode });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
