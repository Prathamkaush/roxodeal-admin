"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MarketplaceProvider } from "@/lib/store";
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MarketplaceProvider>{children}</MarketplaceProvider>
    </QueryClientProvider>
  );
}
