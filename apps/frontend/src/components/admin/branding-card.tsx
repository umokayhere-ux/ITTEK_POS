'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformConfig } from '@/hooks/use-admin';
import { adminApi } from '@/lib/admin';
import { getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess } from '@/lib/types';

/**
 * Lets the super admin set the company logo shown on the login / registration
 * screens. Uploads to Cloudinary via the platform upload endpoint.
 */
export function BrandingCard() {
  const config = usePlatformConfig();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = config.query.data?.logoUrl ?? '';

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data } = await adminApi.post<ApiSuccess<{ url: string }>>('/platform/uploads/image', {
        image: dataUrl,
      });
      config.update.mutate({ logoUrl: data.data.url });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login logo</CardTitle>
        <CardDescription>Shown on the sign-in and registration screens.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-32 place-items-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Company logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> {logoUrl ? 'Replace' : 'Upload logo'}
              </Button>
              {logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={config.update.isPending}
                  onClick={() => config.update.mutate({ logoUrl: '' })}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG with a transparent background works best. Recommended height ~120px.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
