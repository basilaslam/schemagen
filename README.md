# SchemaGen - E-commerce SEO Schema Generator

A professional, Swiss Engineering-styled JSON-LD schema generator for e-commerce products. Generate Google rich snippets with star ratings, prices, and more.

## Features

- **Full Product Schema Generator**: Complete form with all required fields
- **VS Code-style Preview**: Syntax-highlighted JSON-LD output
- **Dynamic Schema API**: Update once, reflect everywhere (Pro feature)
- **Swiss Engineering Design**: Clean, precise, professional UI
- **MongoDB Integration**: Persistent schema storage
- **Real-time Preview**: Instant updates as you type
- **Copy to Clipboard**: One-click code copying
- **Toast Notifications**: Custom feedback via Sonner

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **Database**: MongoDB 7.0
- **Notifications**: Sonner
- **Typography**: Inter + JetBrains Mono

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/schemagen.git
cd schemagen

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Update MONGODB_URI in .env.local
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27018/schemagen
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```

## API Routes

### POST /api/schemas
Save a new schema

**Request:**
```json
{
  "name": "Product Name",
  "description": "Description",
  "price": "99.99",
  "priceCurrency": "USD",
  "url": "https://example.com/product",
  "image": "https://example.com/image.jpg",
  "brand": "Brand",
  "availability": "InStock",
  "sku": "SKU123",
  "dynamic": true
}
```

**Response:**
```json
{
  "success": true,
  "schemaId": "abc123def4"
}
```

### GET /api/schemas/[id]
Get generated JSON-LD for a dynamic schema

**Response:** Returns JSON-LD with `Content-Type: application/ld+json`

### PATCH /api/schemas/[id]
Update an existing schema

## Deployment

### Vercel

1. Push code to GitHub
2. Import repo in Vercel
3. Add environment variables:
   - `MONGODB_URI` (use MongoDB Atlas for production)
   - `NEXT_PUBLIC_APP_URL` (auto-set by Vercel)

### MongoDB Atlas Setup (Recommended for Production)

1. Create free account at https://mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Use it as `MONGODB_URI`

## Design System

### Colors
- **Primary**: Slate-900 (#0F172A)
- **Secondary**: Slate-100 (#F1F5F9)
- **Accent**: Teal-600 (#0D9488)
- **Border**: Slate-200 (#E2E8F0)

### Typography
- **UI**: Inter (14px - 32px)
- **Code**: JetBrains Mono (12px - 14px)

### Components
- Cards: 1px border, subtle shadow
- Inputs: rounded-lg, slate-200 border
- Buttons: rounded-lg, primary/secondary variants

## License

MIT

## Credits

- Design: Swiss Engineering - Inspired by Vercel & Stripe
- Icons: Lucide React
- Components: shadcn/ui
