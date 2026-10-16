"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMockAuth } from "@/lib/mockAuth";
import { MockRole } from "@/types/mockAuth";
import { Loader2 } from "lucide-react";

interface MockRouteGuardProps {
  requiredRole?: MockRole;
  children: React.ReactNode;
}

export function MockRouteGuard({
  requiredRole,
  children,
}: MockRouteGuardProps) {
  const router = useRouter();
  const { role, isAuthenticated, isLoading, isMockEnabled } = useMockAuth();

  useEffect(() => {
    if (!isMockEnabled || isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && role !== requiredRole) {
      if (role === "ADMIN") {
        router.replace("/admin");
      } else if (role === "CANDIDATE") {
        router.replace("/candidate");
      } else {
        router.replace("/login");
      }
    }
  }, [isMockEnabled, isLoading, isAuthenticated, role, requiredRole, router]);

  // When Mock Auth is disabled, completely bypass guard
  if (!isMockEnabled) {
    return <>{children}</>;
  }

  // Prevent hydration flash or content leak while restoring session or redirecting
  if (isLoading || !isAuthenticated || (requiredRole && role !== requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="relative w-12 h-12 mb-4 animate-pulse">
          <Image
            src="/asset/logo-dark.svg"
            alt="EPU Logo"
            width={48}
            height={48}
            className="object-contain block dark:hidden"
            priority
          />
          <Image
            src="/asset/logo-light.svg"
            alt="EPU Logo"
            width={48}
            height={48}
            className="object-contain hidden dark:block"
            priority
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0866D9] font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang xác thực thông tin...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
