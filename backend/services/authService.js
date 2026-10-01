import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL = "7d";
const SALT_ROUNDS = 10;

function requireEmail(email) {
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    throw new HttpError(400, "A valid email is required");
  }
  return email.trim().toLowerCase();
}

function requirePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  return password;
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: user._id.toString(), email: user.email }, secret, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret);
}

export async function register({ email, password }) {
  const cleanEmail = requireEmail(email);
  const cleanPassword = requirePassword(password);

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) throw new HttpError(409, "An account with that email already exists");

  const passwordHash = await bcrypt.hash(cleanPassword, SALT_ROUNDS);
  const user = await User.create({ email: cleanEmail, passwordHash });

  return { token: signToken(user), user: user.toJSON() };
}

export async function login({ email, password }) {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new HttpError(401, "Invalid email or password");
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  return { token: signToken(user), user: user.toJSON() };
}
