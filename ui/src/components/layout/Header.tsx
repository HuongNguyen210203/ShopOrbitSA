"use client";

import Link from "next/link";
import {
  ShoppingBag,
  User,
  Menu,
  ChevronDown,
  LogIn,
  LogOut,
  Tag,
} from "lucide-react";
import SearchBar from "../ui/SearchBar";
import AuthModal from "../ui/AuthModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { catalogApi } from "@/features/catalog/services/catalogApi";
import { UserProfile } from "@/types/auth";
import { Category } from "@/types";
import { basketService, ShoppingCart } from "@/services/basket.service";

const Header = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [basket, setBasket] = useState<ShoppingCart | null>(null);

  useEffect(() => {
    // 1. Fetch User Profile
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        setIsLoggedIn(true);
        const [userData, basketData] = await Promise.all([
          authService.getProfile(),
          basketService.getBasket(),
        ]);
        setUser(userData);
        setBasket(basketData);
      } catch (error) {
        console.error("Token invalid", error);
        handleLogout();
      }
    };

    // 2. Fetch Categories (Dùng catalogApi mới)
    const fetchCategories = async () => {
      try {
        const result = await catalogApi.getCategories(1, 20);
        const list =
          (result as any).data || (Array.isArray(result) ? result : []);

        setCategories(list);
      } catch (error) {
        console.error("Failed to load categories header", error);
      }
    };

    fetchUser();
    fetchCategories();
  }, []);

  const cartItemCount =
    basket?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      router.push("/cart");
    }
  };

  const displayName = user?.fullName || user?.userName || "User";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-6">
          {/* LOGO */}
          <Link
            href="/"
            className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-1 shrink-0"
          >
            ShopOrbit<span className="text-indigo-600">.</span>
          </Link>

          {/* NAVIGATION */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>

            {/* --- DROPDOWN PRODUCTS --- */}
            <div className="group relative h-20 flex items-center cursor-pointer">
              <Link
                href="/products"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors py-2"
              >
                Products{" "}
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform duration-300"
                />
              </Link>

              {/* Mega Menu Dropdown */}
              <div className="absolute top-full left-0 w-125 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out p-6 grid grid-cols-2 gap-6 z-50 before:absolute before:-top-4 before:left-0 before:w-full before:h-4 before:bg-transparent">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Categories
                  </h4>
                  <ul className="space-y-2 max-h-62.5 overflow-y-auto pr-2 custom-scrollbar">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <li key={category.id}>
                          <Link
                            href={`/products?categoryId=${category.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group/item"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Tag size={16} />
                            </div>
                            <div>
                              <span className="block text-gray-900 font-semibold text-sm group-hover/item:text-indigo-600">
                                {category.name}
                              </span>
                            </div>
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-400 italic p-2">
                        Loading...
                      </li>
                    )}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-end relative overflow-hidden group/card h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-50">
                    <ShoppingBag size={80} className="text-gray-200" />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-2 py-1 bg-black text-white text-[10px] font-bold rounded mb-2">
                      HOT DEAL
                    </span>
                    <h5 className="font-bold text-gray-900 mb-1">
                      New Collection
                    </h5>
                    <p className="text-xs text-gray-500 mb-3">
                      Check out the latest tech gadgets.
                    </p>
                    <Link
                      href="/products"
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Shop Now &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/blog"
              className="hover:text-indigo-600 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="hover:text-indigo-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* SEARCH BAR */}
          <div className="flex-1 flex justify-center max-w-md mx-4 md:flex">
            <SearchBar />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Cart */}
            <button
              onClick={handleCartClick}
              className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors group"
              style={{ cursor: "pointer" }}
            >
              <ShoppingBag
                size={22}
                className="text-gray-700 group-hover:text-indigo-600 transition-colors"
              />
              {cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            {/* Auth User */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3 pl-1 group relative">
                <div className="text-right hidden xl:block cursor-pointer">
                  <p className="text-xs font-bold text-gray-900">
                    Hello, {displayName}
                  </p>
                  <p className="text-[10px] text-gray-500">My Account</p>
                </div>
                <button className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold hover:border-indigo-600 transition-all">
                  {displayName.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown User */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-50">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <User size={16} /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:block px-4 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  className="sm:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <LogIn size={22} className="text-gray-700" />
                </Link>
              </div>
            )}

            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-full ml-1">
              <Menu size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default Header;
