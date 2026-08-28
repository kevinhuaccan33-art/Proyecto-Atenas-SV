import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Proyecto Atenas SV", description:"Organizador de proyectos tecnológicos, aplicaciones y avances estudiantiles.", icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body>{children}</body></html>}
