import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  [key: string]: string;
}

export async function getUser(): Promise<UserPayload | null> {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'gizli-anahtar'
    ) as UserPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT hatası:', error);
    return null;
  }
} 