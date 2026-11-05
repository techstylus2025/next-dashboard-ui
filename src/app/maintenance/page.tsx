import Image from "next/image";
import Link from "next/link";
import { Clock3, Settings2 } from "lucide-react";
import { getSchoolBranding } from "@/lib/schoolBranding";

export default async function MaintenancePage() {
  const school = await getSchoolBranding();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -right-24 -top-36 h-[30rem] w-[30rem] rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <section className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/30">
        <div className="h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
        <div className="p-7 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-8 ring-sky-50/60">
            <Settings2 size={28} strokeWidth={1.8} />
          </div>
          <div className="mt-7 flex justify-center">
            <Image src={school.logoUrl} alt={`${school.name} logo`} width={46} height={60} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">A brief pause while we improve</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">We&apos;ll be back soon</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-600">
            The school application is temporarily unavailable while we carry out scheduled maintenance. Your information remains secure. Please check back shortly.
          </p>
          <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
            <Clock3 size={15} className="text-sky-700" />
            Maintenance in progress
          </div>
          <Link
            href="/sign-in"
            className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to sign in
          </Link>
          <p className="mt-8 text-xs text-slate-400">{school.name} · Thank you for your patience</p>
        </div>
      </section>
    </main>
  );
}
