"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axios"; // Import axios đã cấu hình của bạn

interface UserProfile {
  id: string;
  userName: string;
  email: string;
  roles: string[]; // Backend trả về mảng roles
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login"); // Chưa đăng nhập -> Về Login
          return;
        }

        // Gọi API lấy thông tin User hiện tại
        const { data } = await axiosClient.get<UserProfile>("/api/v1/auth/me");

        // Kiểm tra Role
        if (data.roles && data.roles.includes("Admin")) {
          setAuthorized(true); // ✅ Là Admin -> Cho qua
        } else {
          // ❌ Đã đăng nhập nhưng không phải Admin -> Đá về trang chủ
          alert("Bạn không có quyền truy cập trang Quản trị!");
          router.push("/"); 
        }
      } catch (error) {
        // Lỗi mạng hoặc Token hết hạn
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Nếu authorized = true thì mới render trang con (children)
  return authorized ? <>{children}</> : null;
}