"use client";

export type ApiResult = { ok: boolean; error?: string; redirect?: string; id?: number };

export async function postForm(url: string, body: FormData | Record<string, string>): Promise<ApiResult> {
  let res: Response;
  try {
    const payload =
      body instanceof FormData
        ? body
        : (() => {
            const fd = new FormData();
            for (const [k, v] of Object.entries(body)) fd.set(k, v);
            return fd;
          })();
    res = await fetch(url, {
      method: "POST",
      body: payload,
      headers: {
        Accept: "application/json",
      },
    });
  } catch (err) {
    console.error("[postForm] Network error:", err);
    return { ok: false, error: "Sunucuya ulaşılamadı. Lütfen tekrar deneyin." };
  }

  let data: ApiResult;
  try {
    data = (await res.json()) as ApiResult;
  } catch {
    data = { ok: res.ok };
  }

  if (res.status === 401) {
    return { ok: false, error: data.error ?? "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın." };
  }
  if (!res.ok && !data.error) {
    data.error = "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
  }
  return data;
}
