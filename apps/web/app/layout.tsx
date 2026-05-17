import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibebox — The Democratic Aux Cord',
  description:
    'Real-time collaborative music queue. No aux cord dictators. Everyone votes, everyone vibes.',
  keywords: ['music', 'collaborative', 'queue', 'democratic', 'real-time', 'aux cord'],
  openGraph: {
    title: 'Vibebox — The Democratic Aux Cord',
    description: 'No more aux cord dictators. Join a room, add songs, vote together.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="mesh-bg min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
