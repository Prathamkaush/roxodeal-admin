import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  title: {
    default: "Roxodeal — Direct factory-to-buyer marketplace",
    template: "%s | Roxodeal",
  },
  description:
    "Find manufacturers, post free buying requirements, and connect through a trusted B2B lead marketplace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
