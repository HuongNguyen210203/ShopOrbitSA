"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";

import { UserProfile } from "@/types/auth";
import { Order } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Gọi song song 2 API: User Info & Order History
        const [userData, ordersData] = await Promise.all([
          authService.getProfile(),
          orderService.getMyOrders(),
        ]);

        setUser(userData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  // Helper render badge trạng thái
  const renderStatus = (status: string) => {
    switch (status) {
      case "Paid":
      case "Success":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
            Pending
          </span>
        );
      case "Cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
            {status}
          </span>
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* --- LEFT: SIDEBAR PROFILE --- */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-indigo-600 text-3xl font-bold mb-4 border-4 border-white shadow-sm">
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {user?.fullName}
              </h2>
              <p className="text-sm text-gray-500 mb-6">{user?.email}</p>

              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-indigo-600 font-bold rounded-xl">
                  <User size={18} /> My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-red-600 font-medium rounded-xl transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* --- RIGHT: ORDER HISTORY --- */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-indigo-600" /> Order History
            </h2>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">
                  No orders yet
                </h3>
                <p className="text-gray-500 mb-6">
                  You haven't placed any orders yet.
                </p>
                <Link
                  href="/products"
                  className="inline-block px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-gray-800"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                          Order ID
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                          Payment
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-mono text-gray-600">
                            #{order.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            ${order.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {order.paymentMethod}
                          </td>
                          <td className="px-6 py-4">
                            {renderStatus(order.status)}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/profile/orders/${order.id}`}
                              className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Details <ChevronRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
