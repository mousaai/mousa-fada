import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// رابط تسجيل الدخول عبر mousa.ai (حسب الدليل التقني)
export function getMousaLoginUrl(returnPath?: string): string {
  const returnUrl = encodeURIComponent(
    window.location.origin + (returnPath ?? window.location.pathname)
  );
  return `https://www.mousa.ai/api/platform/login-redirect?platform=fada&return_url=${returnUrl}`;
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem("fada-user-info", JSON.stringify(meQuery.data));
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // المنصة مفتوحة للجميع — لا redirect إجباري
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useEffect(() => { /* redirect disabled */ }, [redirectOnUnauthenticated, redirectPath]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    loginUrl: getMousaLoginUrl,
  };
}
