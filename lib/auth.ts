import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { SessionPayload } from './types'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'bcel-best-teller-jwt-secret-2026'
)
const COOKIE_NAME = 'bcel_admin_token'
const EXPIRY = '8h'

export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export { COOKIE_NAME }

export const PERMISSIONS: Record<string, string[]> = {
  superadmin: [
    'teller.add', 'teller.edit', 'teller.delete',
    'ann.add', 'ann.edit', 'ann.delete',
    'user.manage', 'settings.clear', 'export',
  ],
  editor: ['teller.add', 'teller.edit', 'ann.add', 'ann.edit', 'export'],
}

export function can(role: string, permission: string): boolean {
  return (PERMISSIONS[role] ?? []).includes(permission)
}
