import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FlowOps — Quotation workflows",
  description:
    "An AI-assisted portfolio project by Abishek Akash. Fictional quotations, human approvals and reliable automation.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
