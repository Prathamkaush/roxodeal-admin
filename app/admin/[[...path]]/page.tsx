import { Suspense } from "react";
import { AdminPanel } from "@/components/panel";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  return (
    <Suspense fallback={<div className="ms-loading">Loading Roxodeal…</div>}>
      <AdminPanel path={path} />
    </Suspense>
  );
}
