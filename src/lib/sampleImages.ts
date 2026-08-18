/**
 * Curated Sample Images for Instant Demonstration
 * High-quality, fast-loading Unsplash studio shots
 */

export interface SampleImage {
  id: string;
  name: string;
  category: 'Product' | 'Portrait' | 'E-Commerce' | 'Pet';
  badge: string;
  url: string;
  thumbnailUrl: string;
  description: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample_sneaker',
    name: 'streetwear-sneaker.jpg',
    category: 'Product',
    badge: 'Popular',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    description: 'Vibrant crimson Nike sneaker with complex laces and sole details.',
  },
  {
    id: 'sample_portrait',
    name: 'studio-portrait.jpg',
    category: 'Portrait',
    badge: 'Fine Hair',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    description: 'High-contrast studio model portrait testing fine edge hair extraction.',
  },
  {
    id: 'sample_watch',
    name: 'luxury-chronograph.jpg',
    category: 'E-Commerce',
    badge: 'Glossy',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80',
    description: 'Modern smartwatch on minimal surface with metallic reflections.',
  },
  {
    id: 'sample_dog',
    name: 'golden-retriever.jpg',
    category: 'Pet',
    badge: 'Fur Detail',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80',
    description: 'Cheerful golden retriever with soft fur and natural outdoor light.',
  },
];

export async function fetchSampleAsFile(sample: SampleImage): Promise<File> {
  const res = await fetch(sample.url);
  const blob = await res.blob();
  const file = new File([blob], sample.name, { type: blob.type || 'image/jpeg' });
  return file;
}
