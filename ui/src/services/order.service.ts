import axiosClient from "@/lib/axios";
import { Order } from "@/types";

export interface AddressDto {
  firstName: string;
  lastName: string;
  emailAddress: string;
  addressLine: string;
  country: string;
  state: string;
  zipCode: string;
}

export interface CreateOrderRequest {
  shippingAddress: AddressDto;
  paymentMethod: string;
  notes?: string;
}

export interface OrderResponse {
  message: string;
  orderId: string;
}

export const orderService = {
  placeOrder: async (data: CreateOrderRequest): Promise<OrderResponse> => {
    const response = await axiosClient.post("/api/v1/orders", data);
    return response.data;
  },

  payOrder: async (orderId: string): Promise<boolean> => {
    await axiosClient.post(`/api/v1/orders/${orderId}/pay`);
    return true;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await axiosClient.get("/api/v1/orders/my-orders");
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await axiosClient.get(`/api/v1/orders/${id}`);
    return response.data;
  },
};
