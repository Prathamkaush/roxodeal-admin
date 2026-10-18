import { appHref } from "@/lib/app-links";
import Link from "next/link";
export function Brand() {
  return <Link href={appHref("buyer", "/")} className="brand rx-brand" aria-label="Roxodeal marketplace"><img src="/roxodeal-mark.svg" width={42} height={42} alt="" /><span>Roxodeal</span></Link>;
}
