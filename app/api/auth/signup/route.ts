import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json(
        { message: "서버 설정 오류: API_BASE_URL 환경변수를 설정해 주세요." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = typeof body.name === "string" ? body.name : "";
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "이름, 이메일, 비밀번호는 필수입니다." },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const result = (await response.json()) as {
      id?: number;
      email?: string;
      name?: string;
      message?: string | string[];
    };

    if (!response.ok) {
      const message = Array.isArray(result.message)
        ? result.message.join(", ")
        : result.message ?? "회원가입 요청에 실패했습니다.";
      return NextResponse.json({ message }, { status: response.status });
    }

    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
    });
  } catch {
    return NextResponse.json(
      { message: "서버와 통신 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
