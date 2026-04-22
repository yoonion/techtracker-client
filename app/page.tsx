"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "../lib/auth-client";

type BlogSource = {
  id: number;
  name: string | null;
  url: string;
  iconUrl: string | null;
  isActive?: boolean;
  postCount?: number;
  newPostCount?: number;
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

type FeedPostsResponse = {
  items: Omit<FeedPost, "isNew">[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function HomePage() {
  const pageSize = 20;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [sources, setSources] = useState<BlogSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [subscribedSourceIds, setSubscribedSourceIds] = useState<number[]>([]);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingSubscriptionSourceId, setPendingSubscriptionSourceId] = useState<
    number | null
  >(null);
  const [bulkSubscriptionAction, setBulkSubscriptionAction] = useState<
    "subscribe" | "unsubscribe" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedErrorMessage, setFeedErrorMessage] = useState("");
  const [subscriptionNotice, setSubscriptionNotice] = useState("");

  useEffect(() => {
    const fetchSourcesAndSubscriptions = async () => {
      setIsLoading(true);
      setFeedErrorMessage("");

      try {
        const accessToken = localStorage.getItem("accessToken");
        const [sourcesResponse, subscriptionsResponse] = await Promise.all([
          fetch("/api/blog-sources", { cache: "no-store" }),
          accessToken
            ? fetchWithAuth("/api/blog-subscriptions", {
                method: "GET",
                cache: "no-store",
              })
            : Promise.resolve(null),
        ]);

        const sourcesResult: BlogSource[] | { message?: string } =
          await sourcesResponse.json();
        let subscribedSourceIdsResult: number[] = [];
        if (subscriptionsResponse) {
          const subscriptionsResult:
            | { sourceIds?: number[]; message?: string }
            | { message?: string } = await subscriptionsResponse.json();

          if (subscriptionsResponse.ok) {
            if (
              "sourceIds" in subscriptionsResult &&
              Array.isArray(subscriptionsResult.sourceIds)
            ) {
              subscribedSourceIdsResult = subscriptionsResult.sourceIds.filter(
                (item): item is number => typeof item === "number",
              );
            }
          } else if (subscriptionsResponse.status !== 401) {
            const message =
              "message" in subscriptionsResult &&
              typeof subscriptionsResult.message === "string"
                ? subscriptionsResult.message
                : "알림 구독 목록을 불러오지 못했습니다.";
            throw new Error(message);
          }
        }

        if (!sourcesResponse.ok || !Array.isArray(sourcesResult)) {
          const message =
            !Array.isArray(sourcesResult) && typeof sourcesResult.message === "string"
              ? sourcesResult.message
              : "블로그 목록을 불러오지 못했습니다.";
          throw new Error(message);
        }
        setSources(sourcesResult);
        setSubscribedSourceIds(subscribedSourceIdsResult);
      } catch (error) {
        if (error instanceof Error) {
          setFeedErrorMessage(error.message);
        } else {
          setFeedErrorMessage("피드 조회 중 알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSourcesAndSubscriptions();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setFeedErrorMessage("");

      try {
        const query = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
        });
        if (selectedSourceId) {
          query.set("sourceId", String(selectedSourceId));
        }

        const postsResponse = await fetch(`/api/feed/posts?${query.toString()}`, {
          cache: "no-store",
        });
        const postsResult: FeedPostsResponse | { message?: string } =
          await postsResponse.json();

        if (
          !postsResponse.ok ||
          !("items" in postsResult) ||
          !Array.isArray(postsResult.items)
        ) {
          const message =
            "message" in postsResult && typeof postsResult.message === "string"
              ? postsResult.message
              : "피드를 불러오지 못했습니다.";
          throw new Error(message);
        }

        const nowMs = Date.now();
        const nextPosts = postsResult.items.map((post) => ({
          ...post,
          isNew: post.publishedAt
            ? nowMs - new Date(post.publishedAt).getTime() <= 7 * 24 * 60 * 60 * 1000
            : false,
        }));

        setPosts(nextPosts);
        setTotalPages(postsResult.totalPages);
      } catch (error) {
        if (error instanceof Error) {
          setFeedErrorMessage(error.message);
        } else {
          setFeedErrorMessage("피드 조회 중 알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPosts();
  }, [currentPage, selectedSourceId]);

  const selectedSource =
    selectedSourceId === null
      ? null
      : sources.find((source) => source.id === selectedSourceId) ?? null;
  const totalCollectedPostsCount = sources.reduce(
    (sum, source) => sum + (source.postCount ?? 0),
    0,
  );
  const activeSourcesCount = sources.filter((source) => source.isActive !== false).length;
  const subscribedSourcesCount = subscribedSourceIds.filter((sourceId) =>
    sources.some((source) => source.id === sourceId),
  ).length;
  const normalizedSourceSearchQuery = sourceSearchQuery.trim().toLowerCase();
  const searchedSources =
    normalizedSourceSearchQuery.length > 0
      ? sources.filter((source) => {
          const searchableName = source.name?.toLowerCase() ?? "";
          const searchableUrl = source.url.toLowerCase();
          return (
            searchableName.includes(normalizedSourceSearchQuery) ||
            searchableUrl.includes(normalizedSourceSearchQuery)
          );
        })
      : sources;
  const collapsedSourceCount = 7;
  const hasMoreSources =
    normalizedSourceSearchQuery.length === 0 &&
    searchedSources.length > collapsedSourceCount;
  const visibleSources = isSourcesExpanded
    ? searchedSources
    : searchedSources.slice(0, collapsedSourceCount);

  const handleBulkSubscribe = async (subscribeAll: boolean) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setSubscriptionNotice("알림 설정은 로그인 후 사용할 수 있습니다.");
      return;
    }

    const targetSourceIds = subscribeAll
      ? sources
          .map((source) => source.id)
          .filter((sourceId) => !subscribedSourceIds.includes(sourceId))
      : subscribedSourceIds;

    if (targetSourceIds.length === 0) {
      setSubscriptionNotice(
        subscribeAll
          ? "이미 전체 블로그 알림이 설정되어 있습니다."
          : "이미 전체 알림이 해제되어 있습니다.",
      );
      return;
    }

    setSubscriptionNotice("");
    setBulkSubscriptionAction(subscribeAll ? "subscribe" : "unsubscribe");

    try {
      const results = await Promise.allSettled(
        targetSourceIds.map(async (sourceId) => {
          const response = await fetchWithAuth(`/api/blog-subscriptions/${sourceId}`, {
            method: subscribeAll ? "POST" : "DELETE",
          });

          const result = (await response.json()) as { message?: string };
          if (!response.ok) {
            throw new Error(
              typeof result.message === "string"
                ? result.message
                : "알림 설정 변경에 실패했습니다.",
            );
          }

          return sourceId;
        }),
      );

      const successIds = results
        .filter(
          (
            item,
          ): item is PromiseFulfilledResult<number> => item.status === "fulfilled",
        )
        .map((item) => item.value);

      setSubscribedSourceIds((prevIds) => {
        const nextIds = new Set(prevIds);
        if (subscribeAll) {
          successIds.forEach((id) => nextIds.add(id));
        } else {
          successIds.forEach((id) => nextIds.delete(id));
        }
        return Array.from(nextIds);
      });

      const failedCount = targetSourceIds.length - successIds.length;
      if (failedCount > 0) {
        setSubscriptionNotice(
          `${failedCount}개 블로그는 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
        );
      } else {
        setSubscriptionNotice(
          subscribeAll
            ? "전체 알림설정이 완료되었습니다."
            : "전체 알림해제가 완료되었습니다.",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        setSubscriptionNotice(error.message);
      } else {
        setSubscriptionNotice(
          "전체 알림 설정 변경 중 알 수 없는 오류가 발생했습니다.",
        );
      }
    } finally {
      setBulkSubscriptionAction(null);
    }
  };

  const handleToggleSubscribe = async (sourceId: number) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setSubscriptionNotice("알림받기는 로그인 후 사용할 수 있습니다.");
      return;
    }

    setSubscriptionNotice("");
    setPendingSubscriptionSourceId(sourceId);
    const isSubscribed = subscribedSourceIds.includes(sourceId);

    try {
      const response = await fetchWithAuth(`/api/blog-subscriptions/${sourceId}`, {
        method: isSubscribed ? "DELETE" : "POST",
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        const message =
          typeof result.message === "string"
            ? result.message
            : "알림 설정 변경에 실패했습니다.";
        throw new Error(message);
      }

      setSubscribedSourceIds((prevIds) =>
        isSubscribed ? prevIds.filter((id) => id !== sourceId) : [...prevIds, sourceId],
      );
      setSubscriptionNotice(
        isSubscribed ? "알림이 해제되었습니다." : "알림이 설정되었습니다.",
      );
    } catch (error) {
      if (error instanceof Error) {
        setSubscriptionNotice(error.message);
      } else {
        setSubscriptionNotice("알림 설정 변경 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setPendingSubscriptionSourceId(null);
    }
  };

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">TechTracker 피드</h1>
          <p className="mt-2 text-sm text-zinc-600">
            블로그 아이콘 버튼을 눌러 원하는 소스 글만 모아볼 수 있습니다.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-700">
              수집글 총 {totalCollectedPostsCount}개
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-sky-800">
              수집중 블로그 총 {activeSourcesCount}개
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
              구독중 블로그 총 {subscribedSourcesCount}개
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkSubscribe(true)}
              disabled={bulkSubscriptionAction !== null || pendingSubscriptionSourceId !== null}
              className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkSubscriptionAction === "subscribe"
                ? "전체 알림설정 중..."
                : "전체 알림설정"}
            </button>
            <button
              type="button"
              onClick={() => handleBulkSubscribe(false)}
              disabled={bulkSubscriptionAction !== null || pendingSubscriptionSourceId !== null}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkSubscriptionAction === "unsubscribe"
                ? "전체 알림해제 중..."
                : "전체 알림해제"}
            </button>
          </div>
          {subscriptionNotice && (
            <p className="mt-2 text-xs text-zinc-600">{subscriptionNotice}</p>
          )}
          <div className="mt-4">
            <div className="relative">
            <input
              type="text"
              value={sourceSearchQuery}
              onChange={(event) => setSourceSearchQuery(event.target.value)}
              placeholder="블로그 이름 또는 URL 검색"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </span>
            </div>
          </div>
          <div
            className={`mt-5 overflow-hidden transition-all duration-300 ease-in-out ${
              isSourcesExpanded ? "max-h-[2000px]" : "max-h-[360px]"
            }`}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setSelectedSourceId(null);
                setCurrentPage(1);
              }}
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
                {totalCollectedPostsCount}
              </span>
            </button>
              {visibleSources.map((source) => {
                const isSubscribed = subscribedSourceIds.includes(source.id);

                return (
                  <div key={source.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSourceId((prevId) => {
                          const nextId = prevId === source.id ? null : source.id;
                          setCurrentPage(1);
                          return nextId;
                        })
                      }
                      className={`flex min-h-14 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
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
                        {(source.newPostCount ?? 0) > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            NEW
                          </span>
                        )}
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                          {source.postCount ?? 0}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSubscribe(source.id)}
                      disabled={pendingSubscriptionSourceId === source.id}
                      className={`mt-1 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        isSubscribed
                          ? "bg-sky-100 text-sky-800 hover:bg-sky-200"
                          : "bg-white text-zinc-700 hover:bg-zinc-100"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {pendingSubscriptionSourceId === source.id
                        ? "처리 중..."
                        : isSubscribed
                          ? "알림받는 중"
                          : "알림받기"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {normalizedSourceSearchQuery.length > 0 && searchedSources.length === 0 && (
            <p className="mt-3 text-xs text-zinc-500">검색된 블로그가 없습니다.</p>
          )}
          {hasMoreSources && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setIsSourcesExpanded((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:bg-zinc-50"
                aria-label={isSourcesExpanded ? "필터 접기" : "필터 펼치기"}
              >
                <span aria-hidden className="text-sm">
                  {isSourcesExpanded ? "▲" : "▼"}
                </span>
              </button>
            </div>
          )}
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

        {feedErrorMessage && (
          <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {feedErrorMessage}
          </div>
        )}

        {!isLoading && !feedErrorMessage && (
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
            {posts.length === 0 && (
              <div className="rounded-2xl bg-white p-6 text-sm text-zinc-500 shadow-sm">
                선택한 블로그에 수집된 포스트가 없습니다.
              </div>
            )}
          </div>
        )}
        {!isLoading && !feedErrorMessage && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm font-medium text-zinc-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
