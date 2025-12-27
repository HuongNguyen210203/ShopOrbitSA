"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/ui/AuthModal";

import { catalogApi } from "@/features/catalog/services/catalogApi";
import { basketService, BasketItem } from "@/services/basket.service";
import { authService } from "@/services/auth.service";
import { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // --- STATE ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>(
    {}
  );
  const [availableSpecs, setAvailableSpecs] = useState<
    Record<string, string[]>
  >({});

  const parseSpecs = (specsData: any): Record<string, string[]> => {
    if (!specsData) return {};

    const result: Record<string, string[]> = {};

    if (typeof specsData === "object" && !Array.isArray(specsData)) {
      Object.keys(specsData).forEach((key) => {
        const value = specsData[key];
        if (Array.isArray(value)) {
          result[key] = value;
        } else if (typeof value === "string") {
          result[key] = value.includes(",")
            ? value.split(",").map((v) => v.trim())
            : [value.trim()];
        }
      });
      return result;
    }

    if (typeof specsData === "string") {
      const groups = specsData.split("|");
      groups.forEach((group) => {
        const [key, values] = group.split(":");
        if (key && values) {
          result[key.trim()] = values.split(",").map((v) => v.trim());
        }
      });
      return result;
    }

    return {};
  };

  // --- 1. FETCH PRODUCT DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await catalogApi.getProductById(productId);
        setProduct(data);

        // Parse Specs
        if (data.specifications) {
          const parsed = parseSpecs(data.specifications);
          setAvailableSpecs(parsed);

          // Auto select first option
          const initialSelect: Record<string, string> = {};
          Object.keys(parsed).forEach((key) => {
            if (parsed[key] && parsed[key].length > 0) {
              initialSelect[key] = parsed[key][0];
            }
          });
          setSelectedSpecs(initialSelect);
        }
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId]);

  // --- 2. HANDLE OPTION CLICK ---
  const handleSelectSpec = (key: string, value: string) => {
    setSelectedSpecs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // --- 3. HANDLE ADD TO CART ---
  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!product) return;

    // Validate Specs
    const requiredKeys = Object.keys(availableSpecs);
    const selectedKeys = Object.keys(selectedSpecs);
    const missingKeys = requiredKeys.filter((k) => !selectedKeys.includes(k));

    if (missingKeys.length > 0) {
      alert(`Please select: ${missingKeys.join(", ")}`);
      return;
    }

    try {
      setAdding(true);
      const [userProfile, currentBasket] = await Promise.all([
        authService.getProfile(),
        basketService.getBasket(),
      ]);

      let items = currentBasket?.items || [];

      const newItem: BasketItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        imageUrl: product.imageUrl || "",
        selectedSpecifications: selectedSpecs,
      };

      // Kiểm tra trùng
      const existingItemIndex = items.findIndex((i) => {
        const isSameId = i.productId === newItem.productId;
        // Compare object specs (JSON.stringify is the quickest way to compare simple deep objects)
        const isSameSpecs =
          JSON.stringify(i.selectedSpecifications || {}) ===
          JSON.stringify(newItem.selectedSpecifications || {});
        return isSameId && isSameSpecs;
      });

      if (existingItemIndex >= 0) {
        items[existingItemIndex].quantity += quantity;
      } else {
        items.push(newItem);
      }

      await basketService.updateBasket({
        userName: userProfile.userName,
        items: items,
      });

      alert(`Added to cart successfully!`);
      window.location.reload();
    } catch (error) {
      console.error("Add to cart error", error);
      alert("Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold">Product not found</h1>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <button
          onClick={() => router.back()}
          style={{ cursor: "pointer" }}
          className="mb-8 flex items-center text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to products
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* LEFT: IMAGE */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
              <img
                src={
                  product.imageUrl ||
                  "https://placehold.co/600x600?text=No+Image"
                }
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div>
            <div className="mb-2 text-sm font-bold tracking-wide text-indigo-600 uppercase">
              {product.categoryName}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-4">
              {product.name}
            </h1>
            <p className="text-3xl font-black text-gray-900 mb-6">
              ${product.price.toLocaleString()}
            </p>

            <div className="prose prose-sm text-gray-600 mb-8">
              {product.description}
            </div>

            {/* --- SPECIFICATIONS SELECTOR --- */}
            {Object.keys(availableSpecs).length > 0 && (
              <div className="mb-8 space-y-4 border-t border-b border-gray-100 py-6">
                {Object.entries(availableSpecs).map(
                  ([specName, specValues]) => (
                    <div key={specName}>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">
                        {specName}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {/* 👇 Giờ specValues chắc chắn là mảng nhờ hàm parseSpecs đã sửa */}
                        {Array.isArray(specValues) &&
                          specValues.map((value) => {
                            const isSelected =
                              selectedSpecs[specName] === value;
                            return (
                              <button
                                key={value}
                                onClick={() =>
                                  handleSelectSpec(specName, value)
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                  isSelected
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* QUANTITY & ADD TO CART */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Quantity
              </label>
              <div className="flex items-center w-max rounded-full border border-gray-300 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 rounded-l-full"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-gray-100 rounded-r-full"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                style={{ cursor: "pointer" }}
                disabled={adding}
                className="flex-1 bg-black text-white font-bold py-4 px-8 rounded-full hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} /> Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* POLICY */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck size={20} />{" "}
                <span>Free delivery on orders over $200</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck size={20} /> <span>Official 2-year warranty</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
