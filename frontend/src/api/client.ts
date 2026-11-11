import axios, { AxiosError } from "axios";
import type { FieldErrors } from "../types";

export const TOKEN_KEY = "token";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Được AuthProvider đăng ký để xử lý khi token hết hạn (401). */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) onUnauthorized?.();
    return Promise.reject(error);
  }
);

export default client;

type ErrorBody = { message?: string; error?: string; errors?: FieldErrors };

/** Lỗi validation theo từng trường (response 422 của Laravel). */
export const getFieldErrors = (err: unknown): FieldErrors =>
  (err as AxiosError<ErrorBody>)?.response?.data?.errors ?? {};

/** Thông báo lỗi dễ đọc: ưu tiên lỗi trường đầu tiên, rồi message từ backend. */
export const getErrorMessage = (err: unknown, fallback = "Có lỗi xảy ra, vui lòng thử lại."): string => {
  const data = (err as AxiosError<ErrorBody>)?.response?.data;
  const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
  return firstFieldError || data?.message || data?.error || fallback;
};

export const getStatus = (err: unknown): number | undefined =>
  (err as AxiosError)?.response?.status;
