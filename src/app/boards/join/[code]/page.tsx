"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBoardByInviteCode } from "@/lib/store";
import Link from "next/link";

export default function BoardJoinPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const b = await getBoardByInviteCode(code);
      if (b) {
        router.replace("/boards/" + b.id);
      } else {
        setLoading(false);
      }
    }
    load();
  }, [code, router]);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading board...</div>;

  return (
    <div className="py-12 text-center space-y-3">
      <p className="text-2xl">😕</p>
      <p className="text-slate-600 font-medium">Board not found</p>
      <Link href="/" className="text-sky-500 hover:underline text-sm">Go home</Link>
    </div>
  );
}
