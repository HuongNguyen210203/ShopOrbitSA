"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Lock, ArrowRight, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { orderService } from "@/services/order.service";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(val);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length >= 2) {
      val = val.substring(0, 2) + "/" + val.substring(2, 4);
    }
    setExpiry(val);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await orderService.payOrder(orderId);

      router.push("/checkout/success");
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header Card */}
          <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-1">Payment Details</h2>
              <p className="text-gray-400 text-sm mb-6">
                Complete your purchase securely
              </p>

              {/* Visual Card Preview */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 shadow-inner">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-6 bg-yellow-500/80 rounded"></div>
                  <CreditCard className="text-white/80" />
                </div>
                <div className="text-lg font-mono tracking-wider mb-4">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
                <div className="flex justify-between text-xs text-gray-300 uppercase tracking-widest">
                  <div>
                    <span className="block text-[8px]">Card Holder</span>
                    <span className="font-bold text-white">
                      {name || "YOUR NAME"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px]">Expires</span>
                    <span className="font-bold text-white">
                      {expiry || "MM/YY"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePayment} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-mono"
                  placeholder="0000 0000 0000 0000"
                  required
                />
                <CreditCard
                  className="absolute left-3 top-3.5 text-gray-400"
                  size={18}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Card Holder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="JOHN DOE"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={handleExpiryChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-center"
                  placeholder="MM / YY"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  CVC / CVV
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={cvc}
                    onChange={(e) =>
                      setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-center tracking-widest"
                    placeholder="•••"
                    maxLength={3}
                    required
                  />
                  <Lock
                    className="absolute right-3 top-3.5 text-gray-400"
                    size={14}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  Pay Now <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Lock size={10} /> Encrypted for your security
              </p>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
