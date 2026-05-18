import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

export function verifyToken(req: NextRequest): { userId: string; email: string } | null {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Não autorizado. Token inválido ou ausente." },
    { status: 401 }
  );
}