"use client";

import { useEffect, useState } from "react";

type BlogSource = {
  id: number;
  name: string | null;
  url: string;
  iconUrl: string | null;
};

type FeedPost = {
  id: number;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: string | null;
  collectedAt: string;
  source: BlogSource;
  isNew: boolean;
};

export default function HomePage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/feed/posts", {
          cache: "no-store",
        });

        const result:
          | Omit<FeedPost, "isNew">[]
          | {
              message?: string;
            } = await response.json();

        if (!response.ok || !Array.isArray(result)) {
          const message =
            !Array.isArray(result) && typeof result.message === "string"
              ? result.message
              : "피드를 불러오지 못했습니다.";
          throw new Error(message);
        }

        const nowMs = Date.now();
        const nextPosts = result.map((post) => ({
          ...post,
          isNew: post.publishedAt
            ? nowMs - new Date(post.publishedAt).getTime() <= 3 * 24 * 60 * 60 * 1000
            : false,
        }));

        setPosts(nextPosts);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("피드 조회 중 알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPosts();
  }, []);

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">TechTracker 피드</h1>
          <p className="mt-2 text-sm text-zinc-600">
            수집된 테크 블로그 글을 한눈에 확인할 수 있습니다.
          </p>
        </header>

        {isLoading && (
          <div className="rounded-2xl bg-white p-6 text-sm text-zinc-600 shadow-sm">
            피드를 불러오는 중...
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  {post.source.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.source.iconUrl}
                      alt={`${post.source.name ?? "blog"} icon`}
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
                  <p className="text-xs text-zinc-500">
                    {post.source.name && post.source.name.trim()
                      ? post.source.name
                      : post.source.url}
                  </p>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <h2 className="line-clamp-2 text-lg font-semibold text-zinc-900">
                    {post.title}
                  </h2>
                  {post.isNew && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      NEW
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-700">
                  {post.summary && post.summary.trim()
                    ? post.summary
                    : "요약 내용이 없습니다."}
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  게시일:{" "}
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleString()
                    : "날짜 정보 없음"}
                </p>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  원문 보기
                </a>
              </article>
            ))}
            {posts.length === 0 && (
              <div className="rounded-2xl bg-white p-6 text-sm text-zinc-500 shadow-sm">
                아직 수집된 포스트가 없습니다.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
