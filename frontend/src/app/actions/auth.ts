"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/shared/lib/auth-db";
import { createSession, deleteSession } from "@/shared/lib/session";

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) return { error: "Заполните все поля" };
  if (password.length < 6) return { error: "Минимум 6 символов" };

  const existing = getUserByEmail(email);
  if (existing) return { error: "Email уже зарегистрирован" };

  const hash = await bcrypt.hash(password, 10);
  const userId = createUser(email, hash);
  await createSession({ userId, email });
  return { success: true };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) return { error: "Заполните все поля" };

  const user = getUserByEmail(email);
  if (!user) return { error: "Неверный email или пароль" };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { error: "Неверный email или пароль" };

  await createSession({ userId: user.id, email: user.email });
  return { success: true };
}

export async function signOut(): Promise<void> {
  await deleteSession();
}
