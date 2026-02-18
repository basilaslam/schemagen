'use client';

import { useState } from 'react';
import { Save, RefreshCw, Code, LayoutDashboard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ProductSchemaInput } from '@/types/schema';
import { generateProductSchema, schemaToJsonLd } from '@/lib/schemaGenerator';
import { toast } from 'sonner';
import { CodePreview } from '@/components/code-preview';
import { Header } from '@/components/header';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState<ProductSchemaInput>({
    name: '',
    description: '',
    image: '',
    brand: '',
    price: '',
    priceCurrency: 'USD',
    availability: 'InStock',
    sku: '',
    gtin: '',
    url: '',
    aggregateRating: {
      ratingValue: 0,
      reviewCount: 0,
      bestRating: 5,
      worstRating: 1,
    },
  });

  const [generatedSchema, setGeneratedSchema] = useState<string>('');
  const [schemaId, setSchemaId] = useState<string>('');
  const [isDynamic, setIsDynamic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const schema = generateProductSchema(formData);
    const jsonLd = schemaToJsonLd(schema);
    setGeneratedSchema(jsonLd);

    toast.success('Schema generated successfully');
  };

  const handleSave = async () => {
    if (!isLoaded || !user) {
      toast.error('Please sign in to save schemas');
      return;
    }

    if (!formData.name || !formData.price || !formData.url) {
      toast.error('Please fill in Product Name, Price, and URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dynamic: isDynamic,
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSchemaId(data.schemaId);
        toast.success(
          `Schema ${isDynamic ? 'saved' : 'generated'}! ${isDynamic ? 'Use the embed code below' : 'Copy the code to your website'}`
        );
      } else {
        toast.error('Failed to save schema');
      }
    } catch (error) {
      console.error('Error saving schema:', error);
      toast.error('Failed to save schema');
    }
    setLoading(false);
  };

  const handleDynamicUpdate = async () => {
    if (!schemaId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/schemas/${schemaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Dynamic schema updated! Changes reflected instantly.');
      } else {
        toast.error('Failed to update schema');
      }
    } catch (error) {
      console.error('Error updating schema:', error);
      toast.error('Failed to update schema');
    }
    setLoading(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-primary tracking-tight mb-4">
            Welcome to SchemaGen
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Sign in to generate SEO schemas for your products
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary tracking-tight mb-2">
            Generate Product Schema
          </h2>
          <p className="text-slate-500 text-lg">
            Create JSON-LD markup for Google rich snippets. Fast, precise, SEO-ready.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Fill in your product information to generate schema markup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="Premium Wireless Headphones"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="High-quality wireless headphones with active noise cancellation..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="url">Product URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://yourstore.com/product/headphones"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://yourstore.com/images/headphones.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="AudioTech"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={formData.priceCurrency}
                    onChange={(e) => setFormData({ ...formData, priceCurrency: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <select
                    id="availability"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10"
                  >
                    <option value="InStock">In Stock</option>
                    <option value="OutOfStock">Out of Stock</option>
                    <option value="PreOrder">Pre-Order</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="SKU-12345"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              {/* GTIN */}
              <div>
                <Label htmlFor="gtin">GTIN</Label>
                <Input
                  id="gtin"
                  placeholder="1234567890123"
                  value={formData.gtin}
                  onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Optional: Barcode number (ISBN, UPC, EAN)
                </p>
              </div>

              {/* Reviews */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Rating & Reviews
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.5"
                      value={formData.aggregateRating?.ratingValue || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        aggregateRating: {
                          ...formData.aggregateRating!,
                          ratingValue: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviews">Review Count</Label>
                    <Input
                      id="reviews"
                      type="number"
                      min="0"
                      placeholder="150"
                      value={formData.aggregateRating?.reviewCount || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        aggregateRating: {
                          ...formData.aggregateRating!,
                          reviewCount: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full"
                size="lg"
              >
                <Code className="w-4 h-4" />
                Generate Schema
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <div className="space-y-6">
            {/* VS Code-style Code Preview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Generated JSON-LD</CardTitle>
                <CardDescription>
                  Copy this code to your website's &lt;head&gt; section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodePreview code={generatedSchema} language="json" />

                {/* Save Options */}
                {generatedSchema && (
                  <div className="space-y-4">
                    {/* Dynamic Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Dynamic Schema
                        </h4>
                        <p className="text-sm text-slate-500">
                          Update once, reflect everywhere automatically
                        </p>
                      </div>
                      <Switch
                        checked={isDynamic}
                        onCheckedChange={setIsDynamic}
                      />
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {isDynamic ? 'Save Dynamic Schema' : 'Save Schema'}
                        </>
                      )}
                    </Button>

                    {/* Dynamic Schema URL */}
                    {schemaId && isDynamic && (
                      <>
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <h4 className="font-semibold text-primary text-sm mb-2">API Endpoint:</h4>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded block break-all text-slate-700">
                            {`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/schemas/${schemaId}`}
                          </code>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-semibold text-primary text-sm mb-2">Embed Code:</h4>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded block break-all text-slate-700">
                            {`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/schemas/${schemaId}"></script>`}
                          </code>
                        </div>

                        {/* Update Button */}
                        <Button
                          onClick={handleDynamicUpdate}
                          disabled={loading}
                          variant="outline"
                          className="w-full"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Update Schema
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="shadow-card border-slate-200">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
                <CardDescription>
                  Get star ratings in Google search results in 3 steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-accent text-white rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold">1</span>
                    <span className="text-slate-700">Fill in your product details and generate schema</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-accent text-white rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold">2</span>
                    <span className="text-slate-700">Copy the JSON-LD code and paste it into your website's &lt;head&gt; section</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-accent text-white rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold">3</span>
                    <span className="text-slate-700">Use {' '}<a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">Google Rich Results Test</a> to verify</span>
                  </li>
                </ol>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-primary text-sm mb-2">Pro Tip</h4>
                  <p className="text-sm text-slate-600">
                    Dynamic schemas (Pro feature) let you update pricing in one place and see changes instantly across all your product pages.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
