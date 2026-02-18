import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { schemaToJsonLd, generateProductSchema } from '@/lib/schemaGenerator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = await getDb();
    const savedSchema = await db.collection('schemas').findOne({ schemaId: id });

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
    const { id } = await params;
    const updates = await req.json();

    const db = await getDb();
    const result = await db.collection('schemas').updateOne(
      { schemaId: id },
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
