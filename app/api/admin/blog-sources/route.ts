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

    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/blog-sources`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
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
          : "블로그 목록 조회에 실패했습니다.";
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

export async function POST(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json(
        { message: "서버 설정 오류: API_BASE_URL 환경변수를 설정해 주세요." },
        { status: 500 },
      );
    }

    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json(
        { message: "인증 토큰이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { url?: string };
    const url = typeof body.url === "string" ? body.url : "";

    const response = await fetch(`${API_BASE_URL}/blog-sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({ url }),
    });

    const result = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "블로그 등록에 실패했습니다.";
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
