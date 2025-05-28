import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { DeliveryMode } from "@/types/product";
import { getGlobalProducts, addProductToStore as addToGlobalStore } from "../get/route";

// Use the shared global products store
function getProducts() {
  return getGlobalProducts();
}

// Function to add a new product to the global store
export function addProductToStore(product: any) {
  addToGlobalStore(product);
}

export default publicProcedure
  .input(z.object({
    category: z.string().optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    condition: z.enum(['new', 'fresh', 'used', 'needs_repair']).optional(),
    negotiable: z.boolean().optional(),
    userId: z.string().optional(), // Add userId for filtering user's own products
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0)
  }))
  .query(({ input }) => {
    let filteredProducts = [...getProducts()];

    // Filter by userId if provided (for user's own listings)
    if (input.userId) {
      filteredProducts = filteredProducts.filter(p => p.seller.id === input.userId);
    }

    if (input.category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase().includes(input.category!.toLowerCase())
      );
    }

    if (input.location) {
      filteredProducts = filteredProducts.filter(p => 
        p.location.city.toLowerCase().includes(input.location!.toLowerCase()) ||
        p.location.region.toLowerCase().includes(input.location!.toLowerCase())
      );
    }

    if (input.search) {
      filteredProducts = filteredProducts.filter(p =>
        p.title.toLowerCase().includes(input.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(input.search!.toLowerCase())
      );
    }

    if (input.condition) {
      filteredProducts = filteredProducts.filter(p => p.condition === input.condition);
    }

    if (input.negotiable !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.negotiable === input.negotiable);
    }

    const total = filteredProducts.length;
    const products = filteredProducts.slice(input.offset, input.offset + input.limit);

    return {
      products,
      total,
      hasMore: input.offset + input.limit < total
    };
  });