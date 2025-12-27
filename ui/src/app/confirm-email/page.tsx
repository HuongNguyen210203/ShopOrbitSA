"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConfirmEmailContent() {
    const router = useRouter();
    const sp = useSearchParams();

    const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
    const [message, setMessage] = useState<string>("Verifying your email...");

    useEffect(() => {
        const userId = sp.get("userId");
        const token = sp.get("token");

        if (!userId || !token) {
            setStatus("error");
            setMessage("Invalid link. Missing userId or token.");
            return;
        }

        (async () => {
            try {
                const backendUrl = "http://localhost:5000"; 
                const res = await fetch(
                    `${backendUrl}/api/v1/auth/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`,
                    { 
                        method: "GET",
                        headers: { "Content-Type": "application/json" } // Thêm header cho chắc chắn
                    }
                );

                // Parse JSON an toàn hơn
                let data;
                try {
                    data = await res.json();
                } catch (e) {
                    data = null;
                }

                if (!res.ok) {
                    setStatus("error");
                    // Nếu data null (do lỗi 404 html), báo lỗi chung
                    setMessage(data?.message || `Confirmation failed (Status: ${res.status})`);
                    return;
                }

                setStatus("ok");
                setMessage("Email confirmed successfully! Redirecting to login...");

                setTimeout(() => {
                    router.replace("/login?confirmed=1");
                }, 2000);

            } catch (err) {
                console.error(err);
                setStatus("error");
                setMessage("Network error. Could not connect to server.");
            }
        })();
    }, [router, sp]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center border border-gray-100">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Email Confirmation</h1>
                
                {status === "loading" && (
                    <div className="text-blue-600 font-medium animate-pulse">
                        ⏳ {message}
                    </div>
                )}
                
                {status === "ok" && (
                    <div className="text-green-600 font-bold">
                        ✅ {message}
                    </div>
                )}

                {status === "error" && (
                    <div className="text-red-600">
                        <p className="font-medium mb-4">❌ {message}</p>
                        <button 
                            onClick={() => router.push("/login")}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmEmailContent />
        </Suspense>
    );
}