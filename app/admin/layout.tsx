import { PanelShell } from "@/components/panel-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PanelShell role="admin">{children}</PanelShell>;
}
