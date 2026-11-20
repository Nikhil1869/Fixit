import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotShell from "@/components/ChatbotShell";

export const metadata = {
  title: "Fixit",
  description: "Service booking, thoughtfully organized.",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
        <ChatbotShell />
      </body>
    </html>
  );
}
