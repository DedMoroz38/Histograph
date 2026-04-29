"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { signIn as nextAuthSignIn, getSession } from "next-auth/react";
import { signIn, signUp, signOut, type AuthState } from "@/app/actions/auth";
import type { Palette } from "@/shared/config/palette";

const INITIAL: AuthState = {};

interface TelegramUser {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

interface Props {
  pal: Palette;
  dark: boolean;
  userEmail: string | null;
  onClose: () => void;
  onAuthChange: (email: string | null, userId?: string | null, image?: string | null, name?: string | null) => void;
}

export function LoginModal({ pal, dark, userEmail, onClose, onAuthChange }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const telegramContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername || botUsername === "REPLACE_WITH_BOT_USERNAME" || userEmail) return;

    const container = telegramContainerRef.current;
    if (!container) return;

    // Set global callback before the script runs
    (window as unknown as Record<string, unknown>).onTelegramAuth = async (user: TelegramUser) => {
      const result = await nextAuthSignIn("telegram", { ...user, redirect: false });
      if (result?.ok !== false) {
        const raw = localStorage.getItem("hg_watched");
        if (raw) {
          try {
            const ids: string[] = JSON.parse(raw);
            if (ids.length > 0) {
              await fetch("/api/watched/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
              });
              localStorage.removeItem("hg_watched");
            }
          } catch { /* ignore */ }
        }
        const sess = await getSession();
        onAuthChange(
          sess?.user?.email ?? null,
          sess?.user?.id ?? null,
          sess?.user?.image ?? null,
          sess?.user?.name ?? null,
        );
        onClose();
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;
    container.appendChild(script);

    return () => {
      if (container.contains(script)) container.removeChild(script);
      delete (window as unknown as Record<string, unknown>).onTelegramAuth;
    };
  }, [userEmail, onAuthChange, onClose]);

  const mergeLocalStorageWatched = async () => {
    const raw = localStorage.getItem("hg_watched");
    if (!raw) return;
    try {
      const ids: string[] = JSON.parse(raw);
      if (ids.length > 0) {
        await fetch("/api/watched/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        localStorage.removeItem("hg_watched");
      }
    } catch { /* ignore */ }
  };

  const handleAuth = async (_prev: AuthState, formData: FormData): Promise<AuthState> => {
    const result =
      mode === "login" ? await signIn(_prev, formData) : await signUp(_prev, formData);
    if (result.success) {
      await mergeLocalStorageWatched();
      onAuthChange(result.email ?? null, result.userId ?? null);
      onClose();
    }
    return result;
  };

  const [state, formAction, pending] = useActionState(handleAuth, INITIAL);

  const handleLogout = async () => {
    await signOut();
    onAuthChange(null, null);
    onClose();
  };

  const handleGoogleSignIn = () => {
    nextAuthSignIn("google");
  };

  const bg = dark ? "#1c1a17" : "#ffffff";
  const inputBg = dark ? "#111009" : "#f5f3ee";
  const accent = "#c84b31";
  const dividerColor = dark ? "#333" : "#e5e3de";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 340,
          background: bg,
          borderRadius: 10,
          padding: "28px 28px 24px",
          border: `1px solid ${pal.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: pal.text,
              fontFamily: "var(--font-serif)",
            }}
          >
            {userEmail ? "Аккаунт" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: pal.textDim,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {userEmail ? (
          /* Logged-in view */
          <div>
            <div style={{ fontSize: 13, color: pal.textDim, marginBottom: 6 }}>
              Вы вошли как
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: pal.text,
                marginBottom: 20,
                wordBreak: "break-all",
              }}
            >
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 6,
                border: `1px solid ${pal.border}`,
                background: "transparent",
                color: pal.textDim,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Выйти
            </button>
          </div>
        ) : (
          /* Auth form */
          <>
            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 6,
                border: `1px solid ${pal.border}`,
                background: "transparent",
                color: pal.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path
                  d="M44.5 20H24v8.5h11.8C34.7 33.9 29.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.9 20-21 0-1.3-.2-2.7-.5-4z"
                  fill="#FFC107"
                />
                <path
                  d="M6.3 14.7l7 5.1C15.1 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.6 7.9 6.3 14.7z"
                  fill="#FF3D00"
                />
                <path
                  d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.5C29.5 36.1 26.9 37 24 37c-5.1 0-9.5-3.1-11.5-7.5l-7 5.4C9.4 41.6 16.2 45 24 45z"
                  fill="#4CAF50"
                />
                <path
                  d="M44.5 20H24v8.5h11.8c-.9 2.6-2.6 4.7-4.8 6.1l6.6 5.5C41.8 36.9 45 31 45 24c0-1.3-.2-2.7-.5-4z"
                  fill="#1976D2"
                />
              </svg>
              Войти через Google
            </button>

            {/* Telegram login widget */}
            {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME &&
              process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME !== "REPLACE_WITH_BOT_USERNAME" && (
                <div
                  ref={telegramContainerRef}
                  style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
                />
              )}

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ flex: 1, height: 1, background: dividerColor }} />
              <span style={{ fontSize: 11, color: pal.textDim }}>или</span>
              <div style={{ flex: 1, height: 1, background: dividerColor }} />
            </div>

            <form action={formAction}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: pal.textDim,
                    marginBottom: 5,
                    letterSpacing: "0.06em",
                  }}
                >
                  EMAIL
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    height: 36,
                    borderRadius: 6,
                    border: `1px solid ${pal.border}`,
                    background: inputBg,
                    color: pal.text,
                    fontSize: 13,
                    padding: "0 10px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: pal.textDim,
                    marginBottom: 5,
                    letterSpacing: "0.06em",
                  }}
                >
                  ПАРОЛЬ
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  minLength={mode === "signup" ? 8 : undefined}
                  style={{
                    width: "100%",
                    height: 36,
                    borderRadius: 6,
                    border: `1px solid ${pal.border}`,
                    background: inputBg,
                    color: pal.text,
                    fontSize: 13,
                    padding: "0 10px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              {state.error && (
                <div style={{ fontSize: 12, color: accent, marginBottom: 12 }}>
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 6,
                  border: "none",
                  background: pending ? pal.border : accent,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: pending ? "not-allowed" : "pointer",
                  marginBottom: 12,
                  transition: "background 0.15s",
                }}
              >
                {pending ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
              </button>

              <div style={{ textAlign: "center", fontSize: 12, color: pal.textDim }}>
                {mode === "login" ? (
                  <>
                    Нет аккаунта?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: accent,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      Зарегистрироваться
                    </button>
                  </>
                ) : (
                  <>
                    Уже есть аккаунт?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: accent,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      Войти
                    </button>
                  </>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
