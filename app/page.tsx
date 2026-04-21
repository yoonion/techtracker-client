type FeedItem = {
  title: string;
  url: string;
  publishedAt: string;
};

type BlogSection = {
  name: string;
  description: string;
  homepage: string;
  latestPosts: FeedItem[];
};

const BLOG_SECTIONS: BlogSection[] = [
  {
    name: "Naver D2",
    description: "네이버 기술 조직의 엔지니어링 아티클",
    homepage: "https://d2.naver.com/home",
    latestPosts: [
      {
        title: "대규모 트래픽에서 안정적인 배포 전략 구성하기",
        url: "https://d2.naver.com/home",
        publishedAt: "2026-04-18",
      },
      {
        title: "사내 검색 시스템 개선 회고",
        url: "https://d2.naver.com/home",
        publishedAt: "2026-04-10",
      },
    ],
  },
  {
    name: "Kakao Tech",
    description: "카카오 서비스 개발 경험과 기술 공유",
    homepage: "https://tech.kakao.com/",
    latestPosts: [
      {
        title: "메시징 플랫폼 성능 개선 사례",
        url: "https://tech.kakao.com/",
        publishedAt: "2026-04-16",
      },
      {
        title: "대용량 로그 파이프라인 운영 노하우",
        url: "https://tech.kakao.com/",
        publishedAt: "2026-04-07",
      },
    ],
  },
  {
    name: "Toss Tech",
    description: "토스 팀의 제품 개발과 운영 인사이트",
    homepage: "https://toss.tech/",
    latestPosts: [
      {
        title: "송금 서비스의 신뢰성을 높인 모니터링 체계",
        url: "https://toss.tech/",
        publishedAt: "2026-04-14",
      },
      {
        title: "레거시 마이그레이션을 안전하게 진행하는 방법",
        url: "https://toss.tech/",
        publishedAt: "2026-04-09",
      },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">TechTracker 피드</h1>
            <p className="mt-2 text-sm text-zinc-600">
              테크 블로그별 최신 글을 한 번에 확인하는 메인 페이지입니다.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_SECTIONS.map((blog) => (
            <article key={blog.name} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">{blog.name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{blog.description}</p>
                </div>
                <a
                  href={blog.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  방문
                </a>
              </div>

              <ul className="space-y-3">
                {blog.latestPosts.map((post) => (
                  <li key={`${blog.name}-${post.title}`} className="rounded-lg bg-zinc-50 p-3">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-sm font-medium text-zinc-800 hover:underline"
                    >
                      {post.title}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">{post.publishedAt}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
