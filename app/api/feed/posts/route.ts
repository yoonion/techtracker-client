import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json(
        { message: "서버 설정 오류: API_BASE_URL 환경변수를 설정해 주세요." },
        { status: 500 },
      );
    }

    const page = request.nextUrl.searchParams.get("page") ?? "1";
    const limit = request.nextUrl.searchParams.get("limit") ?? "20";
    const sourceId = request.nextUrl.searchParams.get("sourceId");
    const query = new URLSearchParams({ page, limit });
    if (sourceId) {
      query.set("sourceId", sourceId);
    }

    const response = await fetch(`${API_BASE_URL}/blog-posts/public?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const result = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "피드 조회에 실패했습니다.";
      return NextResponse.json({ message }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "서버와 통신 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
