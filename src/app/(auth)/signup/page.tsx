"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      router.push("/onboarding");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
      <p className="mt-2 text-sm text-gray-600">
        Start managing your business on PULSE
      </p>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
        <p className="text-xs text-gray-400 text-center">
          By signing up, you agree to PULSE&apos;s Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
