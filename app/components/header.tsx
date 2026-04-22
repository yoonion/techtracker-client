"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth-client";

type DiscordStatus = {
  connected: boolean;
  discordUsername: string | null;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [isTestDmLoading, setIsTestDmLoading] = useState(false);
  const isAdminRoute = pathname.startsWith("/admin");
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "";

  useEffect(() => {
    const syncAuthState = () => {
      const accessToken = localStorage.getItem("accessToken");
      const storedName = localStorage.getItem("userName");
      if (!accessToken) {
        setUserName(null);
        setDiscordStatus(null);
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
    setDiscordStatus(null);
    router.push(isAdminRoute ? "/admin/login" : "/");
    router.refresh();
  };

  useEffect(() => {
    if (!userName) {
      return;
    }

    let cancelled = false;

    const loadDiscordStatus = async () => {
      try {
        const response = await fetchWithAuth("/api/auth/discord/status", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Discord 상태 조회 실패");
        }

        const result = (await response.json()) as {
          connected?: boolean;
          discordUsername?: string | null;
        };

        if (cancelled) {
          return;
        }

        setDiscordStatus({
          connected: Boolean(result.connected),
          discordUsername: result.discordUsername ?? null,
        });
      } catch {
        if (!cancelled) {
          setDiscordStatus(null);
        }
      }
    };

    void loadDiscordStatus();

    return () => {
      cancelled = true;
    };
  }, [userName]);

  const handleDiscordConnect = async () => {
    if (isDiscordLoading) {
      return;
    }

    setIsDiscordLoading(true);
    try {
      const response = await fetchWithAuth("/api/auth/discord/connect", {
        method: "GET",
      });
      const result = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || typeof result.url !== "string") {
        const message = result.message ?? "Discord 연동을 시작할 수 없습니다.";
        throw new Error(message);
      }

      window.location.href = result.url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Discord 연동 중 오류가 발생했습니다.";
      window.alert(message);
      setIsDiscordLoading(false);
    }
  };

  const handleTestDm = async () => {
    if (isTestDmLoading) {
      return;
    }

    setIsTestDmLoading(true);
    try {
      const response = await fetchWithAuth("/api/auth/discord/test-dm", {
        method: "POST",
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "테스트 DM 전송에 실패했습니다.");
      }
      window.alert("테스트 DM을 보냈습니다. Discord DM을 확인해 주세요.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "테스트 DM 전송 중 오류가 발생했습니다.";
      window.alert(message);
    } finally {
      setIsTestDmLoading(false);
    }
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
                  {inviteUrl ? (
                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
                    >
                      알림 서버 참여
                    </a>
                  ) : (
                    <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                      서버 초대 링크 설정 필요
                    </span>
                  )}
                  {discordStatus?.connected ? (
                    <>
                      <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
                        Discord 연동됨 {discordStatus.discordUsername ? `(${discordStatus.discordUsername})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={handleTestDm}
                        disabled={isTestDmLoading}
                        className="rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isTestDmLoading ? "테스트 전송 중..." : "DM 테스트"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDiscordConnect}
                      disabled={isDiscordLoading}
                      className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDiscordLoading ? "연동 준비 중..." : "Discord 연동"}
                    </button>
                  )}
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
