"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  basketService,
  ShoppingCart,
  BasketItem,
} from "@/services/basket.service";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await basketService.getBasket();
        setCart(data);
      } catch (error) {
        console.error("Failed to load cart", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // --- 2. UPDATE CART (Common function) ---
  const updateCartOnServer = async (updatedItems: BasketItem[]) => {
    if (!cart) return;
    setProcessing(true);
    try {
      const updatedCart = await basketService.updateBasket({
        userName: cart.userName,
        items: updatedItems,
      });
      setCart(updatedCart);
      router.refresh();
    } catch (error) {
      console.error("Update cart failed", error);
      alert("Failed to update cart. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // --- 3. HANDLERS ---
  const handleUpdateQuantity = async (productId: string, change: number) => {
    if (!cart) return;

    const newItems = cart.items.map((item) => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    });

    await updateCartOnServer(newItems);
  };

  const handleRemoveItem = async (productId: string) => {
    if (!cart) return;
    const confirm = window.confirm("Remove this item?");
    if (!confirm) return;

    const newItems = cart.items.filter((item) => item.productId !== productId);
    await updateCartOnServer(newItems);
  };

  // --- 4. CALCULATIONS ---
  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  // const shipping = subtotal > 0 ? 20 : 0;
  // const tax = subtotal * 0.08;
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Header />

      <main className="grow container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Shopping Cart
          </h1>
          <p className="text-gray-500 mt-2">
            {loading
              ? "Loading your cart..."
              : cart && cart.items.length > 0
              ? `You have ${cart.items.length} items in your cart.`
              : "Your cart is currently empty."}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={40} />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm text-center">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              href="/products"
              className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 relative">
            {/* Loading Overlay */}
            {processing && (
              <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-center pt-20">
                <Loader2 className="animate-spin text-black" size={32} />
              </div>
            )}

            {/* --- LEFT COLUMN: CART ITEMS --- */}
            <div className="lg:w-2/3 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                    <img
                      src={
                        item.imageUrl ||
                        "https://placehold.co/200x200/png?text=No+Image"
                      }
                      alt={item.productName}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900">
                      <Link
                        href={`/products/${item.productId}`}
                        className="hover:underline"
                      >
                        {item.productName}
                      </Link>
                    </h3>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      {item.selectedSpecifications &&
                      Object.entries(item.selectedSpecifications).length > 0 ? (
                        Object.entries(item.selectedSpecifications).map(
                          ([key, value]) => (
                            <p key={key} className="text-xs">
                              <span className="font-semibold">{key}:</span>{" "}
                              {value}
                            </p>
                          )
                        )
                      ) : (
                        <p className="text-xs">Standard</p>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-indigo-600 sm:hidden">
                      ${item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center gap-6">
                    {/* Quantity Control */}
                    <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 disabled:opacity-50"
                        disabled={item.quantity <= 1 || processing}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 disabled:opacity-50"
                        disabled={processing}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Desktop Price */}
                    <div className="hidden sm:block text-right min-w-20">
                      <p className="text-lg font-bold text-gray-900">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">
                          ${item.price} each
                        </p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove item"
                      disabled={processing}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <ArrowLeft size={16} /> Continue Shopping
                </Link>
              </div>
            </div>

            {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
            <div className="lg:w-1/3">
              <div className="sticky top-24 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping estimate</span>
                    <span className="font-medium text-gray-900">
                      ${shipping.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax estimate (8%)</span>
                    <span className="font-medium text-gray-900">
                      ${tax.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-gray-900">
                        Order Total
                      </span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={processing}
                  onClick={() => router.push("/checkout")}
                  className="w-full mt-8 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all transform active:scale-[0.98] shadow-xl shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processing ? "Updating..." : "Checkout"}
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
