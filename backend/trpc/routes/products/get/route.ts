import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

// Real products store - starts empty, no mock data
let realProducts: any[] = [];

// Function to add a new product to the real store
export function addProductToStore(product: any) {
  realProducts.unshift(product); // Add to beginning of array
}

// Function to get the real products (for sharing with other modules)
export function getRealProducts() {
  return realProducts;
}

// Function to get a specific product by ID
export function getProductById(id: string) {
  return realProducts.find(p => p.id === id);
}

// Function to update product statistics
export function updateProductStats(id: string, updates: { views?: number; contacts?: number }) {
  const productIndex = realProducts.findIndex(p => p.id === id);
  if (productIndex !== -1) {
    if (updates.views !== undefined) {
      realProducts[productIndex].statistics.views = updates.views;
    }
    if (updates.contacts !== undefined) {
      realProducts[productIndex].statistics.contacts = updates.contacts;
    }
  }
}

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .query(({ input }) => {
    // Search for the product in the real products store
    const product = getProductById(input.id);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  });