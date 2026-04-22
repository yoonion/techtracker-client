"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";

type Me = {
  id: number | null;
  email: string;
  name: string;
  role: string;
  discordUsername: string | null;
  discordConnectedAt: string | null;
};

const initialMe: Me = {
  id: null,
  email: "",
  name: "",
  role: "",
  discordUsername: null,
  discordConnectedAt: null,
};

export default function MyPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me>(initialMe);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadMe = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await fetchWithAuth("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as Me | { message?: string };
        if (!response.ok || !("email" in result)) {
          const message =
            "message" in result && typeof result.message === "string"
              ? result.message
              : "내정보를 불러오지 못했습니다.";
          throw new Error(message);
        }
        setMe(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "내정보 조회 중 알 수 없는 오류가 발생했습니다.";
        setErrorMessage(message);
        if (message.includes("로그인") || message.includes("세션")) {
          router.replace("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadMe();
  }, [router]);

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-zinc-900">내정보</h1>
        <p className="mt-2 text-sm text-zinc-600">
          현재 로그인한 계정 정보를 확인할 수 있습니다.
        </p>

        {isLoading ? (
          <p className="mt-8 text-sm text-zinc-500">내정보를 불러오는 중...</p>
        ) : errorMessage ? (
          <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : (
          <div className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <span className="font-semibold text-zinc-600">회원 번호</span>
              <span className="text-zinc-900">{me.id ?? "-"}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <span className="font-semibold text-zinc-600">아이디(이메일)</span>
              <span className="text-zinc-900">{me.email}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <span className="font-semibold text-zinc-600">이름</span>
              <span className="text-zinc-900">{me.name}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <span className="font-semibold text-zinc-600">권한</span>
              <span className="text-zinc-900">{me.role}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <span className="font-semibold text-zinc-600">Discord</span>
              <span className="text-zinc-900">
                {me.discordUsername ? me.discordUsername : "미연동"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            메인으로
          </Link>
        </div>
      </section>
    </main>
  );
}
