// Loomodex catalog data + remote image resolver.

export type Product = {
  id: string;
  name: string;
  price: number;
  was: number | null;
  off: number;
  slug: string;
  cat: string;
  seller: string;
  rating: number;
  reviews: number;
  sold: number;
};

export type Category = {
  id: string;
  label: string;
  sub: string;
  count: number;
  hue: string;
};

const PHOTO_KEYS: Record<string, string> = {
  'smartphone-pro-max-128gb': 'photo-1511707171634-5f897ff02aa9',
  'wireless-bluetooth-headphones-pro': 'photo-1583394838336-acd977736f90',
  'smart-led-tv-43-full-hd': 'photo-1593359677879-a4bb92f829d1',
  'sport-smartwatch-elite': 'photo-1546868871-7041f2a55e12',
  'portable-bluetooth-speaker': 'photo-1608043152269-423dbba4e7e1',
  'laptop-15-6-8gb-ram-256gb-ssd': 'photo-1496181133206-80ce9b88a853',
  'womens-genuine-leather-handbag': 'photo-1584917865442-de89df76afd3',
  'wireless-noise-cancelling-earbuds': 'photo-1606220588913-b3aacb4d2f46',
  'womens-skincare-bundle': 'photo-1556228720-195a672e8a03',
  'mens-casual-polo-shirt': 'photo-1583743814966-8936f5b7be1a',
  'stainless-steel-kitchen-set-12-piece': 'photo-1556909114-f6e7ad7d3136',
  'premium-perfume-gift-set': 'photo-1541643600914-78b084683601',
  '10000mah-power-bank-fast-charge': 'photo-1609091839311-d5365f9ff1c5',
  'mens-classic-sneakers': 'photo-1542291026-7eec264c27ff',
  'automatic-espresso-coffee-machine': 'photo-1610889556528-9a770e32642f',
};

export const IMG = (slug: string, w = 600): string => {
  const id = PHOTO_KEYS[slug] || PHOTO_KEYS['stainless-steel-kitchen-set-12-piece'];
  return `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=70`;
};

export const CATEGORIES: Category[] = [
  { id: 'beauty',      label: 'Beauté &\nSoins',           sub: 'Skincare & parfum',    count: 2,  hue: '#FFF0E5' },
  { id: 'laptops',    label: 'Ordinateurs\n& Laptops',     sub: 'PC & accessoires',     count: 1,  hue: '#E8EFFE' },
  { id: 'electronics',label: 'Électronique\n& Gadgets',    sub: 'Audio, TV, gadgets',   count: 5,  hue: '#E5F5FF' },
  { id: 'fashion',    label: 'Mode &\nChaussures',         sub: 'Homme & femme',        count: 3,  hue: '#F0E8FF' },
  { id: 'home',       label: 'Maison &\nCuisine',          sub: 'Décor & ustensiles',   count: 2,  hue: '#FFF8E1' },
  { id: 'phones',     label: 'Téléphones\n& Accessoires',  sub: 'Mobiles & recharges',  count: 2,  hue: '#E8EFFE' },
  { id: 'baby',       label: 'Bébé &\nEnfants',            sub: 'Jouets & vêtements',   count: 0,  hue: '#FEF3C7' },
  { id: 'sports',     label: 'Sports &\nPlein Air',        sub: 'Fitness & outdoor',    count: 0,  hue: '#D1FAE5' },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Smartphone Pro Max 128GB', price: 750000, was: 875000, off: 14, slug: 'smartphone-pro-max-128gb', cat: 'phones', seller: 'Conakry Mobile', rating: 4.7, reviews: 248, sold: 312 },
  { id: 'p2', name: 'Wireless Bluetooth Headphones Pro', price: 245000, was: 290000, off: 16, slug: 'wireless-bluetooth-headphones-pro', cat: 'electronics', seller: 'Audio House', rating: 4.6, reviews: 184, sold: 540 },
  { id: 'p3', name: 'Smart LED TV 43" Full HD', price: 2450000, was: 3500000, off: 30, slug: 'smart-led-tv-43-full-hd', cat: 'electronics', seller: 'Vision Pro', rating: 4.8, reviews: 92, sold: 76 },
  { id: 'p4', name: 'Sport Smartwatch Elite', price: 320000, was: 400000, off: 20, slug: 'sport-smartwatch-elite', cat: 'electronics', seller: 'Tech Bazaar', rating: 4.5, reviews: 312, sold: 880 },
  { id: 'p5', name: 'Portable Bluetooth Speaker', price: 175000, was: 195000, off: 10, slug: 'portable-bluetooth-speaker', cat: 'electronics', seller: 'Audio House', rating: 4.4, reviews: 156, sold: 422 },
  { id: 'p6', name: 'Laptop 15.6" 8GB RAM 256GB SSD', price: 4500000, was: null, off: 0, slug: 'laptop-15-6-8gb-ram-256gb-ssd', cat: 'laptops', seller: 'PC Center', rating: 4.6, reviews: 64, sold: 38 },
  { id: 'p7', name: "Women's Genuine Leather Handbag", price: 350000, was: null, off: 0, slug: 'womens-genuine-leather-handbag', cat: 'fashion', seller: 'Maison Diallo', rating: 4.9, reviews: 218, sold: 196 },
  { id: 'p8', name: 'Wireless Noise Cancelling Earbuds', price: 155000, was: 176000, off: 12, slug: 'wireless-noise-cancelling-earbuds', cat: 'electronics', seller: 'Audio House', rating: 4.5, reviews: 412, sold: 1240 },
  { id: 'p9', name: "Women's Skincare Bundle", price: 40000, was: 45000, off: 11, slug: 'womens-skincare-bundle', cat: 'beauty', seller: 'Glow Atelier', rating: 4.8, reviews: 168, sold: 712 },
  { id: 'p10', name: "Men's Casual Polo Shirt", price: 95000, was: null, off: 0, slug: 'mens-casual-polo-shirt', cat: 'fashion', seller: 'Sape Sarl', rating: 4.3, reviews: 88, sold: 220 },
  { id: 'p11', name: 'Stainless Steel Kitchen Set', price: 680000, was: null, off: 0, slug: 'stainless-steel-kitchen-set-12-piece', cat: 'home', seller: 'Cuisine Plus', rating: 4.7, reviews: 54, sold: 132 },
  { id: 'p12', name: 'Premium Perfume Gift Set', price: 380000, was: 450000, off: 16, slug: 'premium-perfume-gift-set', cat: 'beauty', seller: 'Glow Atelier', rating: 4.9, reviews: 96, sold: 188 },
  { id: 'p13', name: '10000mAh Power Bank Fast Charge', price: 95000, was: 120000, off: 21, slug: '10000mah-power-bank-fast-charge', cat: 'electronics', seller: 'Tech Bazaar', rating: 4.4, reviews: 280, sold: 904 },
  { id: 'p14', name: "Men's Classic Sneakers", price: 235000, was: 280000, off: 16, slug: 'mens-classic-sneakers', cat: 'fashion', seller: 'Sape Sarl', rating: 4.6, reviews: 142, sold: 380 },
  { id: 'p15', name: 'Automatic Espresso Coffee Machine', price: 1200000, was: null, off: 0, slug: 'automatic-espresso-coffee-machine', cat: 'home', seller: 'Cuisine Plus', rating: 4.7, reviews: 28, sold: 22 },
];
