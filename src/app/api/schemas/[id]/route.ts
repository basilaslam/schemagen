import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { schemaToJsonLd, generateProductSchema } from '@/lib/schemaGenerator';
import { SavedSchema } from '@/types/schema';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateSchema, validateSchemaId } from '@/lib/validation';
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  DatabaseError,
  SchemaError,
  isAppError,
} from '@/lib/errors';
import { logger, logRequest, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RATE_LIMIT = 30; // 30 requests per minute for public API
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      logError(error, 'GET', '/api/schemas/[id]', undefined, 429, { ip });
      throw error;
    }

    const { userId } = await auth();

    if (!userId) {
      const error = new UnauthorizedError();
      logError(error, 'GET', '/api/schemas/[id]', undefined, 401, { ip });
      throw error;
    }

    const { id } = await params;

    // Validate schema ID
    const idValidation = validateSchemaId(id);

    if (!idValidation.success) {
      const error = new ValidationError(idValidation.error || 'Invalid schema ID');
      logError(error, 'GET', '/api/schemas/[id]', userId, 400, { ip, schemaId: id });
      throw error;
    }

    const db = await getDb();

    let savedSchema: SavedSchema | null;
    try {
      savedSchema = await db.collection('schemas').findOne({
        schemaId: id,
        userId,
      }) as SavedSchema | null;
    } catch (dbError) {
      const error = new DatabaseError('Failed to fetch schema from database', dbError);
      logError(error, 'GET', '/api/schemas/[id]', userId, 500, { ip, schemaId: id });
      throw error;
    }

    if (!savedSchema) {
      const error = new NotFoundError('Schema', id);
      logError(error, 'GET', '/api/schemas/[id]', userId, 404, { ip, schemaId: id });
      throw error;
    }

    if (!savedSchema.dynamic) {
      const error = new SchemaError('This is not a dynamic schema');
      logError(error, 'GET', '/api/schemas/[id]', userId, 400, { ip, schemaId: id });
      throw error;
    }

    const schema = generateProductSchema(savedSchema);
    const jsonLd = schemaToJsonLd(schema);

    const duration = Date.now() - startTime;
    logRequest('GET', '/api/schemas/[id]', userId, 200, duration, { ip, schemaId: id });

    return new NextResponse(jsonLd, {
      headers: {
        'Content-Type': 'application/ld+json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating dynamic schema:', error);

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const ip = await getClientIp(req);

  try {
    const { userId } = await auth();

    if (!userId) {
      const error = new UnauthorizedError();
      logError(error, 'PATCH', '/api/schemas/[id]', undefined, 401, { ip });
      throw error;
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`PATCH:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      const error = new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      logError(error, 'PATCH', '/api/schemas/[id]', userId, 429, { ip });
      throw error;
    }

    const { id } = await params;

    // Validate schema ID
    const idValidation = validateSchemaId(id);

    if (!idValidation.success) {
      const error = new ValidationError(idValidation.error || 'Invalid schema ID');
      logError(error, 'PATCH', '/api/schemas/[id]', userId, 400, { ip, schemaId: id });
      throw error;
    }

    const updates = await req.json();

    // Validate schema data if provided
    if (updates.type) {
      const validation = validateSchema(updates);

      if (!validation.success) {
        const error = new ValidationError('Invalid schema data', validation.errors);
        logError(error, 'PATCH', '/api/schemas/[id]', userId, 400, { ip, schemaId: id });
        throw error;
      }
    }

    const db = await getDb();

    let result;
    try {
      result = await db.collection('schemas').updateOne(
        { schemaId: id, userId },
        { $set: updates }
      );
    } catch (dbError) {
      const error = new DatabaseError('Failed to update schema in database', dbError);
      logError(error, 'PATCH', '/api/schemas/[id]', userId, 500, { ip, schemaId: id });
      throw error;
    }

    if (result.matchedCount === 0) {
      const error = new NotFoundError('Schema', id);
      logError(error, 'PATCH', '/api/schemas/[id]', userId, 404, { ip, schemaId: id });
      throw error;
    }

    const duration = Date.now() - startTime;
    logRequest('PATCH', '/api/schemas/[id]', userId, 200, duration, { ip, schemaId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating schema:', error);

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
