"use client";

import Link from "next/link";
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

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <aside className="h-fit w-56 shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <h2 className="px-3 py-2 text-sm font-semibold text-zinc-500">관리 메뉴</h2>
        <nav className="mt-1 space-y-1">
          <Link
            href="/admin"
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === "/admin"
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            회원관리
          </Link>
          <Link
            href="/admin/blogs"
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === "/admin/blogs"
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            블로그 관리
          </Link>
        </nav>
      </aside>

      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
