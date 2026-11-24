import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
// Display geométrico con carácter para titulares — guiña al ícono de nodos
// conectados del logo SIIAB. Distinto del cuerpo (Geist) de forma clara.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'SIIAB · Portal Interno',
  description:
    'Portal interno SIIAB — catálogo de sitios y reportes por sistema, control de acceso por roles y gestión de solicitudes de vacaciones.',
}

// Debe coincidir con la clave que escribe `ThemeToggle` ("theme": "light" | "dark").
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

export const viewport: Viewport = {
  themeColor: 'oklch(0.2 0.008 75)',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: el script de abajo agrega la clase `dark` a
    // <html> antes de que React hidrate, así que el className difiere a propósito.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Aplica el tema guardado (o el del sistema) antes del primer pintado,
            para evitar un destello de modo claro al recargar. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background font-sans antialiased">
        {children}
        <Toaster position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
