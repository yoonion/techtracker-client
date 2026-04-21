"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const userRole = localStorage.getItem("userRole");
    const isAdmin = Boolean(accessToken) && userRole === "ADMIN";
    const isAdminLoginPage = pathname === "/admin/login";

    if (!isAdmin && !isAdminLoginPage) {
      router.replace("/admin/login");
      return;
    }

    if (isAdmin && isAdminLoginPage) {
      router.replace("/admin");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
