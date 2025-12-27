"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { orderService } from "@/services/order.service";
import { Order } from "@/types";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Failed to load order detail", error);
        // Có thể redirect về trang profile nếu lỗi
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  // Helper render trạng thái (giống bên Profile)
  const renderStatus = (status: string) => {
    switch (status) {
      case "Paid":
      case "Success":
        return (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
            <CheckCircle size={16} /> Paid
          </div>
        );
      case "Pending":
        return (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-bold border border-yellow-100">
            <Clock size={16} /> Pending
          </div>
        );
      case "Cancelled":
        return (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-bold border border-red-100">
            <XCircle size={16} /> Cancelled
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-full text-sm font-bold border border-gray-100">
            {status}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <h1 className="text-xl font-bold">Order not found</h1>
        <Link href="/profile" className="text-indigo-600 hover:underline">
          Back to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Navigation */}
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/profile"
            className="hover:text-black flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Orders
          </Link>
          <span>/</span>
          <span className="font-semibold text-black">
            #{order.id.substring(0, 8)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT: ORDER ITEMS --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Order #{order.id.substring(0, 8)}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    {new Date(order.orderDate).toLocaleString()}
                  </div>
                </div>
                {renderStatus(order.status)}
              </div>

              {/* Product List */}
              <div className="space-y-6">
                {order.items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex gap-4 sm:gap-6 items-start border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                  >
                    {/* 1. Ảnh sản phẩm */}
                    <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative">
                      <img
                        src={
                          item.imageUrl ||
                          "https://placehold.co/150x150?text=No+Image"
                        }
                        alt={item.productName}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    {/* 2. Thông tin chi tiết */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2">
                          {item.productName}
                        </h3>
                        {/* Giá tiền: Lưu ý Backend OrderItem dùng UnitPrice */}
                        <span className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap">
                          ${(item.unitPrice ?? item.price).toLocaleString()}
                        </span>
                      </div>

                      {/* Số lượng */}
                      <p className="text-sm text-gray-500 mt-1">
                        Qty: {item.quantity}
                      </p>

                      {/* 3. Hiển thị thông số (Màu, Size...) */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.specifications &&
                        Object.entries(item.specifications).length > 0 ? (
                          Object.entries(item.specifications).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {key}: {value as string}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-xs text-gray-400">
                            Standard Version
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span>${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* --- RIGHT: INFO SIDEBAR --- */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" /> Shipping
                Address
              </h3>
              {order.shippingAddress ? (
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-900">
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.emailAddress}</p>
                  <p>{order.shippingAddress.addressLine}</p>
                  <p>
                    {order.shippingAddress.state},{" "}
                    {order.shippingAddress.country}{" "}
                    {order.shippingAddress.zipCode}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Address info not available
                </p>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" /> Payment
                Method
              </h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : order.paymentMethod}
                </p>
                <p className="text-xs text-gray-500">
                  Status:{" "}
                  <span className="font-medium">
                    {order.status === "Paid" ? "Paid" : "Pending Payment"}
                  </span>
                </p>
              </div>
            </div>

            {/* Support */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 text-center">
              <Package className="mx-auto text-indigo-600 mb-2" size={32} />
              <h4 className="font-bold text-indigo-900 mb-1">Need Help?</h4>
              <p className="text-xs text-indigo-700 mb-4">
                Issues with this order? Contact our support team.
              </p>
              <button className="text-xs font-bold bg-white text-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
