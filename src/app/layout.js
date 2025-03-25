import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Header from "@/components/Header";
import { dbConnect } from "@/lib/mongo";
import Navbar from "./navbar/page";

export const metadata = {
  title: "Fixit",
  description: "Simplyfying service booking and management",
}

export default async function RootLayout({ children }) {

  const connection = await dbConnect();

  return (
    <html lang="en">
      <body>
          <Navbar/>
        {children}
      </body>
    </html>
  );
}
