"use client";

import { useEffect, useMemo, useState } from "react";

type AdminTab = "members";

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("userRole"),
  );

  useEffect(() => {
    const syncRole = () => {
      setUserRole(localStorage.getItem("userRole"));
    };

    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "members" || userRole !== "ADMIN") {
      return;
    }

    const fetchMembers = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("로그인이 필요합니다.");
        }

        const response = await fetch("/api/admin/users", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const result: Member[] | { message?: string } = await response.json();

        if (!response.ok || !Array.isArray(result)) {
          const message =
            !Array.isArray(result) && typeof result.message === "string"
              ? result.message
              : "회원 목록을 불러오지 못했습니다.";
          throw new Error(message);
        }

        setMembers(result);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("회원 목록 조회 중 알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMembers();
  }, [activeTab, userRole]);

  const isAdmin = useMemo(() => userRole === "ADMIN", [userRole]);

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">관리자 메뉴에서 운영 기능을 관리합니다.</p>

        <div className="mt-6 flex gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "members"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            회원 관리
          </button>
        </div>

        {!isAdmin ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            ADMIN 권한 계정으로 로그인해야 회원 관리 탭을 사용할 수 있습니다.
          </p>
        ) : (
          <div className="mt-6">
            {isLoading && <p className="text-sm text-zinc-600">회원 목록을 불러오는 중...</p>}
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

            {!isLoading && !errorMessage && (
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">이름</th>
                      <th className="px-4 py-3 font-semibold">이메일</th>
                      <th className="px-4 py-3 font-semibold">권한</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-zinc-100">
                        <td className="px-4 py-3 text-zinc-700">{member.id}</td>
                        <td className="px-4 py-3 text-zinc-900">{member.name}</td>
                        <td className="px-4 py-3 text-zinc-700">{member.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                            {member.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                          등록된 회원이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
