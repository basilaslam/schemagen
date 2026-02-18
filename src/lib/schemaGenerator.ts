import { ProductSchema, ProductSchemaInput } from '@/types/schema';

export function generateProductSchema(input: ProductSchemaInput): ProductSchema {
  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.image,
    brand: {
      '@type': 'Brand',
      name: input.brand,
    },
    offers: {
      '@type': 'Offer',
      url: input.url,
      priceCurrency: input.priceCurrency,
      price: input.price,
      availability: `https://schema.org/${input.availability}`,
    },
    sku: input.sku,
  };

  if (input.gtin) {
    schema.gtin = input.gtin;
  }

  if (input.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: input.aggregateRating.bestRating || 5,
      worstRating: input.aggregateRating.worstRating || 1,
    };
  }

  return schema;
}

export function schemaToJsonLd(schema: ProductSchema): string {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}
