import { z } from 'zod';

// Schema type validation
export const SchemaTypeEnum = z.enum([
  'product',
  'organization',
  'article',
  'localBusiness',
  'website',
  'event',
  'person',
  'recipe',
  'review',
  'FAQ',
]);

// Base schema validation
export const BaseSchemaValidation = z.object({
  type: SchemaTypeEnum,
  name: z.string().max(200).trim(),
  description: z.string().max(1000).trim().optional(),
});

// Product schema validation
export const ProductSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('product'),
  name: z.string().max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  productData: z.object({
    name: z.string().max(200).trim().min(1, 'Product name is required'),
    image: z.string().url('Must be a valid URL').optional(),
    description: z.string().max(5000).trim().optional(),
    brand: z.string().max(200).trim().optional(),
    sku: z.string().max(100).trim().optional(),
    gtin: z.string().max(50).trim().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional(),
    priceCurrency: z.string().length(3).optional().default('USD'),
    availability: z.enum(['InStock', 'OutOfStock', 'PreOrder', 'Discontinued']).optional(),
    aggregateRating: z.object({
      ratingValue: z.number().min(0).max(5),
      reviewCount: z.number().int().min(0),
    }).optional(),
  }),
});

// Organization schema validation
export const OrganizationSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('organization'),
  organizationData: z.object({
    name: z.string().max(200).trim().min(1, 'Organization name is required'),
    url: z.string().url('Must be a valid URL').optional(),
    logo: z.string().url('Must be a valid URL').optional(),
    description: z.string().max(5000).trim().optional(),
    contactPoint: z.object({
      telephone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional(),
      email: z.string().email('Invalid email address').optional(),
      contactType: z.string().max(100).trim().optional(),
    }).optional(),
    address: z.object({
      streetAddress: z.string().max(500).trim(),
      addressLocality: z.string().max(200).trim(),
      addressRegion: z.string().max(200).trim(),
      postalCode: z.string().max(50).trim(),
      addressCountry: z.string().max(200).trim(),
    }).optional(),
  }),
});

// Article schema validation
export const ArticleSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('article'),
  articleData: z.object({
    headline: z.string().max(200).trim().min(1, 'Headline is required'),
    image: z.string().url('Must be a valid URL').optional(),
    author: z.string().max(200).trim(),
    datePublished: z.string().datetime().optional(),
    dateModified: z.string().datetime().optional(),
    publisher: z.object({
      name: z.string().max(200).trim(),
      logo: z.string().url('Must be a valid URL').optional(),
    }).optional(),
    articleBody: z.string().max(50000).trim().optional(),
  }),
});

// Local business schema validation
export const LocalBusinessSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('localBusiness'),
  businessData: z.object({
    name: z.string().max(200).trim().min(1, 'Business name is required'),
    image: z.string().url('Must be a valid URL').optional(),
    telephone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional(),
    email: z.string().email('Invalid email address').optional(),
    address: z.object({
      streetAddress: z.string().max(500).trim(),
      addressLocality: z.string().max(200).trim(),
      addressRegion: z.string().max(200).trim(),
      postalCode: z.string().max(50).trim(),
      addressCountry: z.string().max(200).trim(),
    }).optional(),
    openingHours: z.string().max(500).trim().optional(),
    priceRange: z.string().max(50).trim().optional(),
  }),
});

// Website schema validation
export const WebsiteSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('website'),
  websiteData: z.object({
    name: z.string().max(200).trim().min(1, 'Website name is required'),
    url: z.string().url('Must be a valid URL').min(1, 'URL is required'),
    description: z.string().max(5000).trim().optional(),
    potentialAction: z.object({
      target: z.string().url('Must be a valid URL'),
      queryInput: z.string().max(500).trim().optional(),
    }).optional(),
  }),
});

// Event schema validation
export const EventSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('event'),
  eventData: z.object({
    name: z.string().max(200).trim().min(1, 'Event name is required'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    location: z.object({
      name: z.string().max(200).trim(),
      address: z.object({
        streetAddress: z.string().max(500).trim(),
        addressLocality: z.string().max(200).trim(),
        addressRegion: z.string().max(200).trim(),
        postalCode: z.string().max(50).trim(),
        addressCountry: z.string().max(200).trim(),
      }),
    }).optional(),
    image: z.string().url('Must be a valid URL').optional(),
    description: z.string().max(5000).trim().optional(),
    eventStatus: z.enum(['EventScheduled', 'EventMovedOnline', 'EventPostponed', 'EventCancelled']).optional(),
  }),
});

// Person schema validation
export const PersonSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('person'),
  personData: z.object({
    name: z.string().max(200).trim().min(1, 'Name is required'),
    givenName: z.string().max(200).trim().optional(),
    familyName: z.string().max(200).trim().optional(),
    image: z.string().url('Must be a valid URL').optional(),
    jobTitle: z.string().max(200).trim().optional(),
    worksFor: z.object({
      name: z.string().max(200).trim(),
    }).optional(),
    email: z.string().email('Invalid email address').optional(),
    telephone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional(),
    url: z.string().url('Must be a valid URL').optional(),
    sameAs: z.array(z.string().url()).optional(),
  }),
});

// Recipe schema validation
export const RecipeSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('recipe'),
  recipeData: z.object({
    name: z.string().max(200).trim().min(1, 'Recipe name is required'),
    image: z.string().url('Must be a valid URL').optional(),
    description: z.string().max(5000).trim().optional(),
    prepTime: z.string().max(100).trim().optional(),
    cookTime: z.string().max(100).trim().optional(),
    totalTime: z.string().max(100).trim().optional(),
    keywords: z.string().max(500).trim().optional(),
    recipeYield: z.string().max(100).trim().optional(),
    recipeCuisine: z.string().max(200).trim().optional(),
    recipeCategory: z.string().max(200).trim().optional(),
    nutrition: z.object({
      calories: z.string().max(100).trim().optional(),
      fatContent: z.string().max(100).trim().optional(),
      carbohydrateContent: z.string().max(100).trim().optional(),
      proteinContent: z.string().max(100).trim().optional(),
    }).optional(),
  }),
});

// Review schema validation
export const ReviewSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('review'),
  reviewData: z.object({
    itemReviewed: z.object({
      name: z.string().max(200).trim().min(1, 'Item name is required'),
    }),
    reviewRating: z.object({
      ratingValue: z.number().min(1).max(5),
      bestRating: z.number().default(5),
      worstRating: z.number().default(1),
    }),
    author: z.object({
      name: z.string().max(200).trim().min(1, 'Author name is required'),
    }),
    reviewBody: z.string().max(5000).trim().optional(),
    datePublished: z.string().datetime().optional(),
  }),
});

// FAQ schema validation
export const FAQSchemaValidation = BaseSchemaValidation.extend({
  type: z.literal('FAQ'),
  faqData: z.object({
    questions: z.array(z.object({
      question: z.string().max(500).trim().min(1, 'Question is required'),
      answer: z.string().max(5000).trim().min(1, 'Answer is required'),
    })).min(1, 'At least one question is required'),
  }),
});

// Union of all schema types
export const SchemaValidation = z.discriminatedUnion('type', [
  ProductSchemaValidation,
  OrganizationSchemaValidation,
  ArticleSchemaValidation,
  LocalBusinessSchemaValidation,
  WebsiteSchemaValidation,
  EventSchemaValidation,
  PersonSchemaValidation,
  RecipeSchemaValidation,
  ReviewSchemaValidation,
  FAQSchemaValidation,
]);

// Infer TypeScript type from Zod schema
export type SchemaInput = z.infer<typeof SchemaValidation>;

// Schema ID validation
export const SchemaIdValidation = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid schema ID format');

export type ValidationError = {
  path: string[];
  message: string;
};

export function validateSchema(data: unknown): { success: boolean; errors?: ValidationError[]; data?: SchemaInput } {
  const result = SchemaValidation.safeParse(data);

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((err) => ({
      path: err.path.map(String),
      message: err.message,
    }));

    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

export function validateSchemaId(id: unknown): { success: boolean; error?: string } {
  const result = SchemaIdValidation.safeParse(id);

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid schema ID' };
  }

  return { success: true };
}
