"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SignupResponse = {
  id: number;
  email: string;
  name: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedCopyrightNotice, setAgreedCopyrightNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isAllAgreed = agreedTerms && agreedPrivacy && agreedCopyrightNotice;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      if (!agreedPrivacy || !agreedTerms || !agreedCopyrightNotice) {
        throw new Error("필수 동의 항목을 모두 체크해 주세요.");
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result: SignupResponse | { message?: string } = await response.json();

      if (!response.ok || !("id" in result)) {
        const message =
          "message" in result && typeof result.message === "string"
            ? result.message
            : "회원가입에 실패했습니다.";
        throw new Error(message);
      }

      setSuccessMessage("회원가입 성공! 로그인 페이지로 이동합니다.");
      setName("");
      setEmail("");
      setPassword("");
      setAgreedPrivacy(false);
      setAgreedTerms(false);
      setAgreedCopyrightNotice(false);
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("회원가입 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-zinc-900">회원가입</h1>
        <p className="mt-2 text-sm text-zinc-600">이름, 이메일, 비밀번호를 입력해 주세요.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <p className="font-semibold text-zinc-800">필수 동의</p>
            <label className="mt-2 flex items-start gap-2 border-b border-zinc-200 pb-2">
              <input
                type="checkbox"
                checked={isAllAgreed}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAgreedTerms(checked);
                  setAgreedPrivacy(checked);
                  setAgreedCopyrightNotice(checked);
                }}
                className="mt-0.5"
              />
              <span className="font-semibold text-zinc-800">[전체 동의] 필수 항목 모두 동의</span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(event) => setAgreedTerms(event.target.checked)}
                className="mt-0.5"
              />
              <span>[필수] 서비스 이용약관에 동의합니다.</span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(event) => setAgreedPrivacy(event.target.checked)}
                className="mt-0.5"
              />
              <span>[필수] 개인정보 수집·이용에 동의합니다.</span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreedCopyrightNotice}
                onChange={(event) => setAgreedCopyrightNotice(event.target.checked)}
                className="mt-0.5"
              />
              <span>[필수] 외부 블로그 콘텐츠 저작권 고지를 확인했습니다.</span>
            </label>
          </div>

          <details className="rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
            <summary className="cursor-pointer font-semibold text-zinc-800">
              서비스 이용약관(요약)
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>본 서비스는 테크 블로그 글을 수집하여 목록/알림 기능을 제공합니다.</li>
              <li>서비스 운영을 방해하거나 비정상적인 접근을 시도하면 이용이 제한될 수 있습니다.</li>
              <li>서비스 내용은 예고 없이 변경될 수 있습니다.</li>
            </ul>
          </details>

          <details className="rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
            <summary className="cursor-pointer font-semibold text-zinc-800">
              개인정보 수집·이용 동의(요약)
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>수집 항목: 이름, 이메일, 비밀번호(암호화 저장), Discord 연동 식별자(연동 시)</li>
              <li>이용 목적: 회원 식별, 로그인 인증, 계정 관리, 알림 기능 제공</li>
              <li>보유 기간: 회원 탈퇴 시까지(관련 법령에 따라 보존이 필요한 경우 해당 기간)</li>
              <li>동의 거부 시 회원가입 및 계정 기반 기능 이용이 제한됩니다.</li>
            </ul>
          </details>

          <details className="rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
            <summary className="cursor-pointer font-semibold text-zinc-800">
              외부 블로그 콘텐츠 저작권 고지
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>본 서비스는 외부 블로그의 글 제목/요약/링크를 제공합니다.</li>
              <li>원문 콘텐츠의 저작권은 각 블로그 및 원저작권자에게 있습니다.</li>
              <li>원문 이용은 해당 사이트의 이용약관 및 정책을 따릅니다.</li>
            </ul>
          </details>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isLoading ? "회원가입 중..." : "회원가입"}
          </button>
        </form>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
        {successMessage && <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>}

        <div className="mt-6 border-t border-zinc-200 pt-4">
          <Link
            href="/login"
            className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
