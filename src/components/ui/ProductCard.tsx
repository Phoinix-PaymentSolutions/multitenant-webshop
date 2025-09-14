// src/components/ProductCard.tsx
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types'; // Use the correct type here

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void; // New prop to handle adding to cart
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card hover>
      <div className="relative aspect-square w-full">
        <Image
          src={product.imageUrl || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          className="object-cover rounded-t-xl"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
         {product.description && (
          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
        )}
        <p className="text-gray-600 mt-1">€{product.price.toFixed(2)}</p>
        <Button
          onClick={() => onAddToCart(product)}
          className="mt-4 w-full"
          disabled={product.inventory <= 0}
        >
          {product.inventory > 0 ? 'Add to Cart' : 'out of Stock'}
        </Button>
      </div>
    </Card>
  );
};