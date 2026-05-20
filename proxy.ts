import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/pacientes', '/rutinas', '/ejercicios']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  if (isProtected && !request.cookies.get('kinetrack')?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|p/).*)'],
}
