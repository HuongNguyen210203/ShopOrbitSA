import axiosClient from "@/lib/axios";

export interface BasketItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  selectedSpecifications?: Record<string, string>;
  imageUrl?: string;
}

export interface ShoppingCart {
  userName: string;
  items: BasketItem[];
  totalPrice?: number;
}

export const basketService = {
  getBasket: async (): Promise<ShoppingCart | null> => {
    try {
      const response = await axiosClient.get("/api/v1/basket");
      return response.data;
    } catch (error) {
      return null;
    }
  },

  updateBasket: async (basket: ShoppingCart): Promise<ShoppingCart> => {
    const response = await axiosClient.post("/api/v1/basket", basket);
    return response.data;
  },

  deleteBasket: async () => {
    await axiosClient.delete("/api/v1/basket");
  },
};
