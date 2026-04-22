import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

type MeResponse = {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
  discordUsername?: string | null;
  discordConnectedAt?: string | null;
  message?: string | string[];
};

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

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      cache: "no-store",
    });

    const result = (await response.json()) as MeResponse;
    if (!response.ok) {
      const message = Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message ?? "내정보 조회에 실패했습니다.";
      return NextResponse.json({ message }, { status: response.status });
    }

    return NextResponse.json({
      id: result.id ?? null,
      email: result.email ?? "",
      name: result.name ?? "",
      role: result.role ?? "",
      discordUsername: result.discordUsername ?? null,
      discordConnectedAt: result.discordConnectedAt ?? null,
    });
  } catch {
    return NextResponse.json(
      { message: "서버와 통신 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
