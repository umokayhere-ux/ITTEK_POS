'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleCrud } from '@/components/simple-crud';
import { brands, categories, units } from '@/hooks/resources';

const TABS = [
  { key: 'categories', label: 'Categories' },
  { key: 'brands', label: 'Brands' },
  { key: 'units', label: 'Units' },
] as const;

export default function CatalogPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('categories');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Organize products with categories, brands and units.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? 'primary' : 'outline'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {tab === 'categories' && (
            <SimpleCrud hooks={categories} label="Category" fields={[{ key: 'description', label: 'Description' }]} />
          )}
          {tab === 'brands' && (
            <SimpleCrud hooks={brands} label="Brand" fields={[{ key: 'description', label: 'Description' }]} />
          )}
          {tab === 'units' && (
            <SimpleCrud
              hooks={units}
              label="Unit"
              fields={[{ key: 'abbreviation', label: 'Abbreviation', required: true }]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
