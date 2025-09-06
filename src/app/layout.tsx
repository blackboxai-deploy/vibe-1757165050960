import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QR Attendance System",
  description: "Modern attendance tracking system with QR codes and face recognition",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#7f1d1d',
              color: '#fff',
              border: '1px solid #991b1b'
            },
          }}
        />
      </body>
    </html>
  );
}