// Autenticación de Timón (Google SSO + email/password).
// Persiste JWT y user en localStorage vía zustand/persist.
// El token se inyecta automáticamente en las peticiones via axios interceptor.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { http } from "./api";

export type Provider = "google" | "password";

export type User = {
  id: number;
  name: string;
  email: string;
  picture: string;
  provider: Provider;
  role: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
  clearError: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      loading: false,
      error: null,

      loginWithGoogle: async (credential: string) => {
        set({ loading: true, error: null });
        try {
          const { data } = await http.post<{ access_token: string; user: User }>(
            "/api/auth/google",
            { credential },
          );
          set({ loading: false, token: data.access_token, user: data.user });
        } catch (err: any) {
          const msg = err?.response?.data?.detail ?? "Error al autenticar con Google";
          set({ loading: false, error: msg });
          throw err;
        }
      },

      loginWithPassword: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const { data } = await http.post<{ access_token: string; user: User }>(
            "/api/auth/login",
            { email, password },
          );
          set({ loading: false, token: data.access_token, user: data.user });
        } catch (err: any) {
          const msg = err?.response?.data?.detail ?? "Credenciales inválidas";
          set({ loading: false, error: msg });
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const { data } = await http.post<{ access_token: string; user: User }>(
            "/api/auth/register",
            { name, email, password },
          );
          set({ loading: false, token: data.access_token, user: data.user });
        } catch (err: any) {
          const msg = err?.response?.data?.detail ?? "Error al registrar la cuenta";
          set({ loading: false, error: msg });
          throw err;
        }
      },

      logout: () => set({ user: null, token: null, error: null }),
      setHydrated: () => set({ hydrated: true }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "timon-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

// Interceptor: inyecta el JWT en cada petición axios.
http.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401, limpia la sesión.
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(err);
  },
);
