import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { schemaToJsonLd, generateProductSchema } from '@/lib/schemaGenerator';
import { SavedSchema, SavedSchemaInput } from '@/types/schema';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateSchema, validateSchemaId } from '@/lib/validation';

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
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate schema ID
    const idValidation = validateSchemaId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: idValidation.error },
        { status: 400 }
      );
    }

    const db = await getDb();
    const savedSchema = await db.collection('schemas').findOne({
      schemaId: id,
      userId,
    }) as SavedSchema | null;

    if (!savedSchema) {
      return NextResponse.json(
        { success: false, error: 'Schema not found' },
        { status: 404 }
      );
    }

    if (!savedSchema.dynamic) {
      return NextResponse.json(
        { success: false, error: 'This is not a dynamic schema' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { success: false, error: 'Failed to generate schema' },
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = await getClientIp(req);
    const rateLimitResult = await rateLimit(`PATCH:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const { id } = await params;

    // Validate schema ID
    const idValidation = validateSchemaId(id);

    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: idValidation.error },
        { status: 400 }
      );
    }

    const updates = await req.json();

    // Validate schema data if provided
    if (updates.type) {
      const validation = validateSchema(updates);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid schema data',
            errors: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    const db = await getDb();
    const result = await db.collection('schemas').updateOne(
      { schemaId: id, userId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schema' },
      { status: 500 }
    );
  }
}
