import './globals.css';

export const metadata = {
  title: "Fractal Trainer",
  description: "Pattern recognition game for crypto trading.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#000080] text-white font-mono p-4 min-h-screen">
        {children}
      </body>
    </html>
  );
}