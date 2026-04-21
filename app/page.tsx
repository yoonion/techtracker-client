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
  const [sources, setSources] = useState<BlogSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [postsResponse, sourcesResponse] = await Promise.all([
          fetch("/api/feed/posts", { cache: "no-store" }),
          fetch("/api/blog-sources", { cache: "no-store" }),
        ]);

        const postsResult:
          | Omit<FeedPost, "isNew">[]
          | {
              message?: string;
            } = await postsResponse.json();
        const sourcesResult: BlogSource[] | { message?: string } =
          await sourcesResponse.json();

        if (!postsResponse.ok || !Array.isArray(postsResult)) {
          const message =
            !Array.isArray(postsResult) && typeof postsResult.message === "string"
              ? postsResult.message
              : "피드를 불러오지 못했습니다.";
          throw new Error(message);
        }

        if (!sourcesResponse.ok || !Array.isArray(sourcesResult)) {
          const message =
            !Array.isArray(sourcesResult) && typeof sourcesResult.message === "string"
              ? sourcesResult.message
              : "블로그 목록을 불러오지 못했습니다.";
          throw new Error(message);
        }

        const nowMs = Date.now();
        const nextPosts = postsResult.map((post) => ({
          ...post,
          isNew: post.publishedAt
            ? nowMs - new Date(post.publishedAt).getTime() <= 3 * 24 * 60 * 60 * 1000
            : false,
        }));

        setPosts(nextPosts);
        setSources(sourcesResult);
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

    void fetchData();
  }, []);

  const filteredPosts = selectedSourceId
    ? posts.filter((post) => post.source.id === selectedSourceId)
    : posts;
  const sourceHasNewMap = new Map<number, boolean>();
  const sourcePostCountMap = new Map<number, number>();
  posts.forEach((post) => {
    if (post.isNew) {
      sourceHasNewMap.set(post.source.id, true);
    }
    sourcePostCountMap.set(
      post.source.id,
      (sourcePostCountMap.get(post.source.id) ?? 0) + 1,
    );
  });
  const selectedSource =
    selectedSourceId === null
      ? null
      : sources.find((source) => source.id === selectedSourceId) ?? null;

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">TechTracker 피드</h1>
          <p className="mt-2 text-sm text-zinc-600">
            블로그 아이콘 버튼을 눌러 원하는 소스 글만 모아볼 수 있습니다.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setSelectedSourceId(null)}
              className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                selectedSourceId === null
                  ? "border-sky-300 bg-sky-100 text-sky-800 shadow-sm"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-200 text-[11px] font-bold text-zinc-700">
                ALL
              </span>
              <span className="line-clamp-2">전체 블로그 보기</span>
              <span className="ml-auto shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                {posts.length}
              </span>
            </button>
            {sources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() =>
                  setSelectedSourceId((prevId) => (prevId === source.id ? null : source.id))
                }
                className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  selectedSourceId === source.id
                    ? "border-sky-300 bg-sky-100 text-sky-800 shadow-sm"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                }`}
              >
                {source.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={source.iconUrl}
                    alt={`${source.name ?? "blog"} icon`}
                    className="h-7 w-7 rounded-md object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="inline-block h-7 w-7 rounded-md bg-zinc-200" />
                )}
                <span className="line-clamp-2">
                  {source.name && source.name.trim() ? source.name : source.url}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {sourceHasNewMap.get(source.id) && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      NEW
                    </span>
                  )}
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                    {sourcePostCountMap.get(source.id) ?? 0}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            {selectedSource
              ? `현재 필터: ${selectedSource.name && selectedSource.name.trim() ? selectedSource.name : selectedSource.url}`
              : "현재 필터: 전체"}
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
            {filteredPosts.map((post) => (
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
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {post.title}
                    </a>
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
              </article>
            ))}
            {filteredPosts.length === 0 && (
              <div className="rounded-2xl bg-white p-6 text-sm text-zinc-500 shadow-sm">
                선택한 블로그에 수집된 포스트가 없습니다.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
