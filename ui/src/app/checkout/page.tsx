"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { basketService, ShoppingCart } from "@/services/basket.service";
import { orderService, CreateOrderRequest } from "@/services/order.service";
import { authService } from "@/services/auth.service";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    country: "Vietnam",
    state: "HCM",
    zip: "",
    paymentMethod: "COD",
    notes: "",
  });

  // 1. Load Cart & User Info
  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login?redirect=/checkout");
        return;
      }

      try {
        // Load cart to display subtotal
        const basketData = await basketService.getBasket();
        if (!basketData || !basketData.items || basketData.items.length === 0) {
          router.push("/cart");
          return;
        }
        setCart(basketData);

        // Pre-fill user info
        try {
          const userProfile = await authService.getProfile();
          const names = userProfile.fullName.split(" ");
          setFormData((prev) => ({
            ...prev,
            email: userProfile.email,
            firstName: names[0] || "",
            lastName: names.slice(1).join(" ") || "",
          }));
        } catch (e) {
          /* Ignore */
        }
      } catch (error) {
        console.error("Init checkout failed", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Handle Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart) return;

    setSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailAddress: formData.email,
          addressLine: formData.address,
          country: formData.country,
          state: formData.state,
          zipCode: formData.zip,
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      const res = await orderService.placeOrder(payload);

      if (formData.paymentMethod === "Visa") {
        router.push(`/checkout/payment/${res.orderId}`);
      } else {
        router.push("/checkout/success");
      }
    } catch (error: any) {
      console.error("Checkout failed", error);
      alert("Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const shipping = subtotal > 0 ? 20 : 0;
  const total = subtotal + shipping;

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
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/cart"
            className="hover:text-black flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Cart
          </Link>
          <span>/</span>
          <span className="font-semibold text-black">Checkout</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
        >
          {/* --- LEFT: BILLING DETAILS --- */}
          <div className="lg:col-span-7 space-y-8">
            {/* Address Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-indigo-600" /> Shipping Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  >
                    <option value="Vietnam">Vietnam</option>
                    <option value="USA">United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State / City
                  </label>
                  <input
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    required
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="text-indigo-600" /> Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === "COD"}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium text-gray-900">
                    Cash on Delivery (COD)
                  </span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Visa"
                    checked={formData.paymentMethod === "Visa"}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-black focus:ring-black"
                  />
                  <span className="font-medium text-gray-900">
                    Credit Card (Visa/Master)
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 outline-none"
                  rows={3}
                  placeholder="Notes about your order, e.g. special notes for delivery."
                />
              </div>
            </div>
          </div>

          {/* --- RIGHT: ORDER SUMMARY --- */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Your Order
                </h2>

                {/* Item List */}
                <div className="space-y-4 mb-6 max-h-75 overflow-y-auto custom-scrollbar pr-2">
                  {cart?.items.map((item) => (
                    <div
                      key={
                        item.productId +
                        JSON.stringify(item.selectedSpecifications)
                      }
                      className="flex gap-4"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative">
                        <img
                          src={item.imageUrl || "https://placehold.co/100x100"}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                          {item.productName}
                        </h4>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.selectedSpecifications &&
                            Object.values(item.selectedSpecifications).join(
                              ", "
                            )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 mt-1">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>${shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="w-full mt-8 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Place Order</>
                  )}
                </button>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <ShieldCheck size={16} /> Secure SSL Encryption
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
