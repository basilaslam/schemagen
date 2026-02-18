export interface ProductSchemaInput {
  name: string;
  description: string;
  image: string;
  brand: string;
  price: string;
  priceCurrency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  sku: string;
  gtin?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  url: string;
}

export interface SavedSchema extends ProductSchemaInput {
  _id?: string;
  schemaId: string;
  dynamic: boolean;
  userId?: string;
  createdAt: Date;
}

export interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image: string;
  brand: {
    '@type': string;
    name: string;
  };
  offers: {
    '@type': string;
    url: string;
    priceCurrency: string;
    price: string;
    availability: string;
  };
  sku: string;
  gtin?: string;
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
}
