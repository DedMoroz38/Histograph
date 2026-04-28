"use client";

import { useState, useActionState } from "react";
import { signIn, signUp, signOut, type AuthState } from "@/app/actions/auth";
import type { Palette } from "@/shared/config/palette";

const INITIAL: AuthState = {};

interface Props {
  pal: Palette;
  dark: boolean;
  userEmail: string | null;
  onClose: () => void;
  onAuthChange: (email: string | null) => void;
}

export function LoginModal({ pal, dark, userEmail, onClose, onAuthChange }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleAuth = async (_prev: AuthState, formData: FormData): Promise<AuthState> => {
    const result = mode === "login" ? await signIn(_prev, formData) : await signUp(_prev, formData);
    if (result.success) {
      const email = (formData.get("email") as string).trim().toLowerCase();
      onAuthChange(email);
      onClose();
    }
    return result;
  };

  const [state, formAction, pending] = useActionState(handleAuth, INITIAL);

  const handleLogout = async () => {
    await signOut();
    onAuthChange(null);
    onClose();
  };

  const bg = dark ? "#1c1a17" : "#ffffff";
  const inputBg = dark ? "#111009" : "#f5f3ee";
  const accent = "#c84b31";

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: pal.text, fontFamily: "var(--font-serif)" }}>
            {userEmail ? "Аккаунт" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: pal.textDim, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {userEmail ? (
          /* Logged-in view */
          <div>
            <div style={{ fontSize: 13, color: pal.textDim, marginBottom: 6 }}>Вы вошли как</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: pal.text, marginBottom: 20, wordBreak: "break-all" }}>
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
          <form action={formAction}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: pal.textDim, marginBottom: 5, letterSpacing: "0.06em" }}>
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
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: pal.textDim, marginBottom: 5, letterSpacing: "0.06em" }}>
                ПАРОЛЬ
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••"
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
              <div style={{ fontSize: 12, color: accent, marginBottom: 12 }}>{state.error}</div>
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
                    style={{ background: "none", border: "none", cursor: "pointer", color: accent, fontWeight: 600, fontSize: 12 }}
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
                    style={{ background: "none", border: "none", cursor: "pointer", color: accent, fontWeight: 600, fontSize: 12 }}
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
