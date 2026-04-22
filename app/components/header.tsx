"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    const syncAuthState = () => {
      const accessToken = localStorage.getItem("accessToken");
      const storedName = localStorage.getItem("userName");
      if (!accessToken) {
        setUserName(null);
        return;
      }
      setUserName(storedName && storedName.trim() ? storedName : "회원");
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setUserName(null);
    router.push(isAdminRoute ? "/admin/login" : "/");
    router.refresh();
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={isAdminRoute ? "/admin" : "/"}
          className="flex items-center gap-2 text-lg font-bold text-zinc-900"
        >
          <Image
            src="/techtracker-icon.png"
            alt="TechTracker logo"
            width={32}
            height={32}
            unoptimized
            priority
            className="rounded-md"
          />
          <span>{isAdminRoute ? "TechTracker Admin" : "TechTracker"}</span>
        </Link>
        <nav className="flex items-center gap-2">
          {userName ? (
            <>
              {!isAdminRoute && (
                <>
                  <Link
                    href="/mypage"
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    내정보
                  </Link>
                </>
              )}
              <span className="px-2 text-sm font-medium text-zinc-700">{userName}님</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href={isAdminRoute ? "/admin/login" : "/login"}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                로그인
              </Link>
              {!isAdminRoute && (
                <Link
                  href="/signup"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  회원가입
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
