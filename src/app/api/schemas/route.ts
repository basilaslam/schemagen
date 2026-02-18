import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { SavedSchema } from '@/types/schema';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dynamic = false } = body;

    const schemaId = nanoid(10);
    const savedSchema: SavedSchema = {
      ...body,
      schemaId,
      dynamic,
      createdAt: new Date(),
    };

    const db = await getDb();
    await db.collection('schemas').insertOne(savedSchema);

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
    const searchParams = req.nextUrl.searchParams;
    const schemaId = searchParams.get('id');

    if (!schemaId) {
      return NextResponse.json(
        { success: false, error: 'Schema ID required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const schema = await db.collection('schemas').findOne({ schemaId });

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
