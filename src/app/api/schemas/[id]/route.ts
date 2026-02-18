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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RATE_LIMIT = 30; // 30 requests per minute for public API
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = await getClientIp(req);
    const rateLimitResult = await rateLimit(`GET:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
    }

    const { userId } = await auth();

    if (!userId) {
      throw new UnauthorizedError();
    }

    const { id } = await params;

    // Validate schema ID
    const idValidation = validateSchemaId(id);

    if (!idValidation.success) {
      throw new ValidationError(idValidation.error || 'Invalid schema ID');
    }

    const db = await getDb();

    let savedSchema: SavedSchema | null;
    try {
      savedSchema = await db.collection('schemas').findOne({
        schemaId: id,
        userId,
      }) as SavedSchema | null;
    } catch (dbError) {
      throw new DatabaseError('Failed to fetch schema from database', dbError);
    }

    if (!savedSchema) {
      throw new NotFoundError('Schema', id);
    }

    if (!savedSchema.dynamic) {
      throw new SchemaError('This is not a dynamic schema');
    }

    const schema = generateProductSchema(savedSchema);
    const jsonLd = schemaToJsonLd(schema);

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
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new UnauthorizedError();
    }

    // Rate limiting
    const ip = await getClientIp(req);
    const rateLimitResult = await rateLimit(`PATCH:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
    }

    const { id } = await params;

    // Validate schema ID
    const idValidation = validateSchemaId(id);

    if (!idValidation.success) {
      throw new ValidationError(idValidation.error || 'Invalid schema ID');
    }

    const updates = await req.json();

    // Validate schema data if provided
    if (updates.type) {
      const validation = validateSchema(updates);

      if (!validation.success) {
        throw new ValidationError('Invalid schema data', validation.errors);
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
      throw new DatabaseError('Failed to update schema in database', dbError);
    }

    if (result.matchedCount === 0) {
      throw new NotFoundError('Schema', id);
    }

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
