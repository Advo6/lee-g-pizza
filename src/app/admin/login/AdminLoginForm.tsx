"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Pizza } from "lucide-react";
import { STORE_INFO } from "@/lib/utils";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = searchParams.get("from") || "/admin";
        router.push(from);
        router.refresh();
      } else {
        setError("Incorrect password. Staff access only.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red shadow-glow">
            <Pizza className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-white">Staff Login</h1>
          <p className="mt-2 text-sm text-stone-400">
            {STORE_INFO.name} — owner & staff only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-stone-400">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field !pl-10"
                placeholder="Enter staff password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-600">
          Customer?{" "}
          <Link href="/" className="text-brand-orange hover:underline">
            Back to menu
          </Link>
        </p>
      </div>
    </div>
  );
}
