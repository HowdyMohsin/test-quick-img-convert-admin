import './globals.css';
import { Inter } from 'next/font/google';
import { BRAND } from '@/lib/brand';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const metadata = { title: BRAND.adminTitle, description: 'Administration for Quick IMG Convert.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={inter.className}>{children}</body></html>;
}
