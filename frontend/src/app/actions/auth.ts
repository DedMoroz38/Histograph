"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";
import { getUserByEmail, createUser } from "@/shared/lib/auth-db";

export interface AuthState {
  error?: string;
  success?: boolean;
  email?: string;
  userId?: string;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) return { error: "Заполните все поля" };
  if (password.length < 8) return { error: "Минимум 8 символов" };

  const existing = getUserByEmail(email);
  if (existing) return { error: "Email уже зарегистрирован" };

  const hash = await bcrypt.hash(password, 10);
  createUser(email, hash);

  try {
    await nextAuthSignIn("credentials", { email, password, redirect: false });
    const user = getUserByEmail(email);
    return { success: true, email, userId: user ? String(user.id) : undefined };
  } catch (err) {
    if (err instanceof AuthError) return { error: "Не удалось войти после регистрации" };
    throw err;
  }
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) return { error: "Заполните все поля" };

  try {
    await nextAuthSignIn("credentials", { email, password, redirect: false });
    const user = getUserByEmail(email);
    return { success: true, email, userId: user ? String(user.id) : undefined };
  } catch (err) {
    if (err instanceof AuthError) return { error: "Неверный email или пароль" };
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await nextAuthSignOut({ redirect: false });
}
