import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { SavedSchema, SavedSchemaInput } from '@/types/schema';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateSchema, validateSchemaId } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RATE_LIMIT = 20; // 20 requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = await getClientIp(req);
    const rateLimitResult = await rateLimit(`POST:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW);

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

    const body = await req.json();

    // Validate schema data
    const validation = validateSchema(body);

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
    // Use any to bypass type check for _id field - MongoDB will handle it
    await db.collection('schemas').insertOne(savedSchema as any);

    return NextResponse.json({
      success: true,
      schemaId,
      dynamic,
    });
  } catch (error) {
    console.error('Error saving schema:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save schema' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const schemaId = searchParams.get('id');

    // Validate schema ID
    const idValidation = validateSchemaId(schemaId);

    if (!schemaId || !idValidation.success) {
      return NextResponse.json(
        { success: false, error: idValidation.error || 'Schema ID required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const schema = await db.collection('schemas').findOne({
      schemaId,
      userId,
    }) as SavedSchema | null;

    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, schema });
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}
