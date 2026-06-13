"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check auth on client-side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = await import("@/lib/supabase").then((m) => m.supabase);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
        }
        setAuthChecked(true);
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  // Show nothing while checking auth
  if (!authChecked) {
    return null;
  }

  return <>{children}</>;
}
