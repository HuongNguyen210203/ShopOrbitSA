import Link from "next/link";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        <div className="mx-auto h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. Your order has been received and is being
          processed.
        </p>

        <div className="space-y-3">
          <Link
            href="/products"
            className="block w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            <Home size={18} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
