export type MockRole = "ADMIN" | "CANDIDATE";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: MockRole;
  avatarUrl?: string;
}

export interface MockAuthState {
  user: MockUser | null;
  role: MockRole | null;
  isAuthenticated: boolean;
  isMock: boolean;
  isLoading: boolean;
}

export interface MockAuthContextType extends MockAuthState {
  loginAsAdmin: () => void;
  loginAsCandidate: () => void;
  logout: () => void;
  isMockEnabled: boolean;
}

export const MOCK_ADMIN_USER: MockUser = {
  id: "mock-admin-001",
  name: "Demo Administrator",
  email: "admin@mock.local",
  role: "ADMIN",
  avatarUrl: "/asset/logo-dark.svg",
};

export const MOCK_CANDIDATE_USER: MockUser = {
  id: "mock-candidate-001",
  name: "Demo Candidate",
  email: "candidate@mock.local",
  role: "CANDIDATE",
  avatarUrl: "/asset/candidate-avatar.jpg",
};
