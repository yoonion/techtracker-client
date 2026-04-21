"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type BlogSource = {
  id: number;
  name: string | null;
  url: string;
  iconUrl: string | null;
  rssUrl: string | null;
  isActive: boolean;
  lastCollectedAt: string | null;
  createdAt: string;
};

export default function AdminBlogsPage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sources, setSources] = useState<BlogSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchSources = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch("/api/admin/blog-sources", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result: BlogSource[] | { message?: string } = await response.json();

      if (!response.ok || !Array.isArray(result)) {
        const message =
          !Array.isArray(result) && typeof result.message === "string"
            ? result.message
            : "블로그 목록을 불러오지 못했습니다.";
        throw new Error(message);
      }

      setSources(result);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("블로그 목록 조회 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSources();
  }, [fetchSources]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch("/api/admin/blog-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, url }),
      });
      const result: BlogSource | { message?: string } = await response.json();

      if (!response.ok || !("id" in result)) {
        const message =
          "message" in result && typeof result.message === "string"
            ? result.message
            : "블로그 등록에 실패했습니다.";
        throw new Error(message);
      }

      setName("");
      setUrl("");
      setSuccessMessage("블로그가 등록되었습니다.");
      void fetchSources();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("블로그 등록 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (source: BlogSource) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`/api/admin/blog-sources/${source.id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !source.isActive }),
      });

      const result: BlogSource | { message?: string } = await response.json();
      if (!response.ok || !("id" in result)) {
        const message =
          "message" in result && typeof result.message === "string"
            ? result.message
            : "수집 상태 변경에 실패했습니다.";
        throw new Error(message);
      }

      setSources((prev) =>
        prev.map((item) =>
          item.id === source.id ? { ...item, isActive: result.isActive } : item,
        ),
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("상태 변경 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  const handleDelete = async (source: BlogSource) => {
    const confirmed = window.confirm(
      `정말 삭제할까요?\n삭제 대상: ${source.url}\n삭제 후 복구할 수 없습니다.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(source.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch(`/api/admin/blog-sources/${source.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result: { message?: string } = await response.json();
      if (!response.ok) {
        const message =
          typeof result.message === "string"
            ? result.message
            : "블로그 삭제에 실패했습니다.";
        throw new Error(message);
      }

      setSources((prev) => prev.filter((item) => item.id !== source.id));
      setSuccessMessage("블로그가 삭제되었습니다.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("삭제 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-zinc-900">블로그 관리</h1>
      <p className="mt-2 text-sm text-zinc-600">
        수집할 테크 블로그 URL을 등록하고 수집 활성 여부를 관리합니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="블로그 이름 (예: Naver D2)"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/tech"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "등록 중..." : "URL 등록"}
        </button>
      </form>

      {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
      {successMessage && <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>}

      <div className="mt-6 rounded-xl border border-zinc-200">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-700">
            <tr>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">블로그 이름</th>
              <th className="px-4 py-3 font-semibold">블로그 URL</th>
              <th className="px-4 py-3 font-semibold">RSS 경로</th>
              <th className="px-4 py-3 font-semibold">등록일</th>
              <th className="px-4 py-3 font-semibold">마지막 수집일</th>
              <th className="px-4 py-3 font-semibold">수집 상태</th>
              <th className="px-4 py-3 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  블로그 목록을 불러오는 중...
                </td>
              </tr>
            )}

            {!isLoading &&
              sources.map((source) => (
                <tr key={source.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-zinc-700">{source.id}</td>
                  <td className="px-4 py-3 text-zinc-900">
                    <div className="flex items-center gap-2">
                      {source.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={source.iconUrl}
                          alt={`${source.name ?? "blog"} icon`}
                          className="h-4 w-4 rounded-sm object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="inline-block h-4 w-4 rounded-sm bg-zinc-200" />
                      )}
                      <span>{source.name && source.name.trim() ? source.name : "-"}</span>
                    </div>
                  </td>
                  <td className="break-all px-4 py-3 text-zinc-900">{source.url}</td>
                  <td className="break-all px-4 py-3 text-zinc-700">{source.rssUrl ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {new Date(source.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {source.lastCollectedAt
                      ? new Date(source.lastCollectedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          source.isActive ? "text-emerald-700" : "text-zinc-500"
                        }`}
                      >
                        {source.isActive ? "ON" : "OFF"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleToggle(source)}
                        aria-label={`수집 상태 토글 (${source.isActive ? "ON" : "OFF"})`}
                        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${
                          source.isActive ? "bg-emerald-500" : "bg-zinc-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            source.isActive ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleDelete(source)}
                      disabled={deletingId === source.id}
                      className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === source.id ? "삭제 중..." : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}

            {!isLoading && sources.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  등록된 블로그 URL이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
