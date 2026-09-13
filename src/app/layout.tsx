import "./globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import ProgressBar from "./components/ProgressBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NITH Results",
  description: "NIT Hamirpur student results and rankings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

