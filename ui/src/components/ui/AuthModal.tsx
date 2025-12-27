"use client";

import { X, LogIn } from "lucide-react";
import Link from "next/link";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center mt-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <LogIn size={28} />
          </div>

          <h3 className="text-lg font-bold text-gray-900">
            Sign in to continue
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Please sign in to view your cart and proceed to checkout.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] hover:bg-gray-800"
            >
              Go to Login
            </Link>

            <button
              onClick={onClose}
              className="w-full rounded-xl py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-indigo-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
