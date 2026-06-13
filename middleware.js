import { NextResponse } from "next/server";

export async function middleware(request) {
  // Middleware disabled temporarily - just pass through
  return NextResponse.next();
}

export const config = {
  matcher: [], // Empty matcher = middleware tidak jalan
};
