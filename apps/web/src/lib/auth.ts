export type UserRole = "candidate" | "staff" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}

export function getRedirectPathForRole(role: UserRole): string {
  switch (role) {
    case "staff":
      return "/staff";
    case "admin":
      return "/admin";
    case "candidate":
    default:
      return "/candidate";
  }
}

/**
 * Client authentication service interface.
 * Connects to backend API if available, or provides a clean interface for session management.
 */
class AuthService {
  private currentUser: AuthUser | null = null;

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const res = await fetch(`${api}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
        return data;
      }
    } catch {
      // Backend auth endpoint might not exist yet
    }

    // Default response when backend endpoint is not yet connected:
    // Safely reject with clear information without faking credentials
    throw new Error(
      "Hệ thống xác thực backend đang được kết nối. Vui lòng thử lại sau hoặc tiếp tục với tư cách Khách."
    );
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const res = await fetch(`${api}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: credentials.fullName,
          email: credentials.email,
          phone: credentials.phone,
          password: credentials.password,
          // Role is always strictly candidate for public self-registration
          role: "candidate",
        }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend auth endpoint not yet connected
    }

    throw new Error(
      "Hệ thống đăng ký tài khoản đang được bảo trì. Vui lòng liên hệ ban tuyển sinh hoặc trải nghiệm với tư cách Khách."
    );
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      await fetch(`${api}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silent catch to prevent email enumeration
    }
    // Always return success to prevent email enumeration
    return { success: true };
  }
}

export const authService = new AuthService();
