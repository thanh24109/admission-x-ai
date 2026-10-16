"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  MockUser,
  MockRole,
  MockAuthContextType,
  MOCK_ADMIN_USER,
  MOCK_CANDIDATE_USER,
} from "@/types/mockAuth";

const STORAGE_KEY = "epu_mock_auth_session";

/**
 * Validates whether Mock Auth is allowed and active.
 * STRICT SECURITY REQUIREMENT:
 * Must ONLY be active when NODE_ENV === "development" AND NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true".
 */
export function isMockAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true"
  );
}

const MockAuthContext = createContext<MockAuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isMock: false,
  isLoading: true,
  isMockEnabled: false,
  loginAsAdmin: () => {},
  loginAsCandidate: () => {},
  logout: () => {},
});

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mockEnabled = useMemo(() => isMockAuthEnabled(), []);

  const [user, setUser] = useState<MockUser | null>(null);
  const [role, setRole] = useState<MockRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMock, setIsMock] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore mock session on application initialization
  useEffect(() => {
    if (!mockEnabled) {
      // If mock auth is disabled, clear any stale mock session
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore localStorage error in private mode
      }
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MockUser = JSON.parse(stored);
        if (parsed && (parsed.role === "ADMIN" || parsed.role === "CANDIDATE")) {
          setUser(parsed);
          setRole(parsed.role);
          setIsAuthenticated(true);
          setIsMock(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn("Failed to restore mock auth session:", e);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  }, [mockEnabled]);

  const loginAsAdmin = useCallback(() => {
    if (!mockEnabled) return;
    setUser(MOCK_ADMIN_USER);
    setRole("ADMIN");
    setIsAuthenticated(true);
    setIsMock(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ADMIN_USER));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
    router.push("/admin");
  }, [mockEnabled, router]);

  const loginAsCandidate = useCallback(() => {
    if (!mockEnabled) return;
    setUser(MOCK_CANDIDATE_USER);
    setRole("CANDIDATE");
    setIsAuthenticated(true);
    setIsMock(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_CANDIDATE_USER));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
    router.push("/candidate");
  }, [mockEnabled, router]);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setIsMock(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("LocalStorage remove error:", e);
    }
    router.push("/login");
  }, [router]);

  const contextValue: MockAuthContextType = useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isMock,
      isLoading,
      isMockEnabled: mockEnabled,
      loginAsAdmin,
      loginAsCandidate,
      logout,
    }),
    [
      user,
      role,
      isAuthenticated,
      isMock,
      isLoading,
      mockEnabled,
      loginAsAdmin,
      loginAsCandidate,
      logout,
    ]
  );

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

/**
 * Access the mock authentication context.
 */
export function useMockAuth(): MockAuthContextType {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}
