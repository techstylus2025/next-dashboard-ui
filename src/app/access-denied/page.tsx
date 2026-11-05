import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getSchoolBranding } from "@/lib/schoolBranding";

export default async function AccessDeniedPage() {
  const school = await getSchoolBranding();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
      <section className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white p-7 text-center shadow-2xl shadow-black/30 sm:p-11">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <ShieldCheck size={30} strokeWidth={1.8} />
        </div>
        <div className="mt-7 flex justify-center">
          <Image src={school.logoUrl} alt={`${school.name} logo`} width={42} height={54} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Access restricted</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">You can&apos;t access this app</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
          Access to the school application has been restricted for this account or user role. If you believe this is a mistake, contact your school administrator.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Return to sign in
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-400">{school.name} · Secure access</p>
      </section>
    </main>
  );
}
