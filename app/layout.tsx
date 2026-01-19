import { AuthProvider } from '@/lib/auth-context';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Enterprise Portal - Digital Production',
  description: 'Digital Production Digitazation Enterprise Portal',
  openGraph: {
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo-master.png`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo-master.png`,
      },
    ],
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
