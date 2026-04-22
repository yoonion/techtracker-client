"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { fetchWithAuth } from "../../../../lib/auth-client";

type BlogSourceDetail = {
  id: number;
  name: string | null;
  url: string;
  iconUrl: string | null;
  rssUrl: string | null;
  isActive: boolean;
  lastCollectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminBlogDetailPage() {
  const params = useParams<{ id: string }>();
  const sourceId = Number(params.id);
  const isInvalidSourceId = !Number.isFinite(sourceId) || sourceId <= 0;
  const [source, setSource] = useState<BlogSourceDetail | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isInvalidSourceId) {
      return;
    }

    const fetchSource = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchWithAuth(`/api/admin/blog-sources/${sourceId}`, {
          cache: "no-store",
        });
        const result: BlogSourceDetail | { message?: string } = await response.json();

        if (!response.ok || !("id" in result)) {
          const message =
            "message" in result && typeof result.message === "string"
              ? result.message
              : "블로그 상세 정보를 불러오지 못했습니다.";
          throw new Error(message);
        }

        setSource(result);
        setName(result.name ?? "");
        setUrl(result.url);
        setIconUrl(result.iconUrl ?? "");
        setIsActive(result.isActive);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("블로그 상세 조회 중 알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSource();
  }, [isInvalidSourceId, sourceId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!source) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetchWithAuth(`/api/admin/blog-sources/${source.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          iconUrl: iconUrl.trim(),
          isActive,
        }),
      });
      const result: BlogSourceDetail | { message?: string } = await response.json();

      if (!response.ok || !("id" in result)) {
        const message =
          "message" in result && typeof result.message === "string"
            ? result.message
            : "블로그 정보 저장에 실패했습니다.";
        throw new Error(message);
      }

      setSource(result);
      setName(result.name ?? "");
      setUrl(result.url);
      setIconUrl(result.iconUrl ?? "");
      setIsActive(result.isActive);
      setSuccessMessage("블로그 정보가 저장되었습니다.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("저장 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">블로그 상세 수정</h1>
        <Link
          href="/admin/blogs"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          목록으로
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        블로그 이름, URL, 아이콘, 수집 상태를 수정할 수 있습니다.
      </p>

      {isInvalidSourceId && (
        <p className="mt-4 text-sm text-red-600">잘못된 블로그 ID입니다.</p>
      )}
      {isLoading && <p className="mt-6 text-sm text-zinc-600">상세 정보를 불러오는 중...</p>}
      {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
      {successMessage && <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>}

      {!isInvalidSourceId && !isLoading && source && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              블로그 이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="url" className="text-sm font-medium text-zinc-700">
              블로그 URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="iconUrl" className="text-sm font-medium text-zinc-700">
              아이콘 URL
            </label>
            <input
              id="iconUrl"
              type="url"
              value={iconUrl}
              onChange={(event) => setIconUrl(event.target.value)}
              placeholder="https://.../favicon.png"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-zinc-700">
              수집 활성(ON)
            </label>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
            <p>RSS 경로: {source.rssUrl ?? "-"}</p>
            <p>등록일: {new Date(source.createdAt).toLocaleString()}</p>
            <p>
              마지막 수집일:{" "}
              {source.lastCollectedAt
                ? new Date(source.lastCollectedAt).toLocaleString()
                : "-"}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </form>
      )}
    </main>
  );
}
