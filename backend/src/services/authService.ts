import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { createError } from '../utils/createError';

const SALT_ROUNDS = 12;

const signToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw createError('JWT_SECRET is not configured', 500, false);

  return jwt.sign({ id, email }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

// ── Register ─────────────────────────────────────────────
export const register = async (
  email: string,
  password: string,
  name: string
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken(user.id, user.email);
  return { user, token };
};

// ── Login ────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw createError('Invalid email or password', 401);
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };

  const token = signToken(user.id, user.email);
  return { user: safeUser, token };
};

// ── Get Me ───────────────────────────────────────────────
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) throw createError('User not found', 404);
  return user;
};
