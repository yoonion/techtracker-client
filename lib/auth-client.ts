type RefreshResponse = {
  accessToken?: string;
  message?: string;
};

function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    clearAuthStorage();
    return null;
  }

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const result = (await response.json()) as RefreshResponse;
  if (!response.ok || typeof result.accessToken !== "string") {
    clearAuthStorage();
    return null;
  }

  localStorage.setItem("accessToken", result.accessToken);
  return result.accessToken;
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("로그인이 필요합니다.");
  }

  const requestHeaders = new Headers(init.headers ?? {});
  requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  let response = await fetch(input, {
    ...init,
    headers: requestHeaders,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken();
  if (!refreshedAccessToken) {
    throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
  }

  const retryHeaders = new Headers(init.headers ?? {});
  retryHeaders.set("Authorization", `Bearer ${refreshedAccessToken}`);
  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
  });

  return response;
}

