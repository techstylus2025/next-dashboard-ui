import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

const faqs = {
  general: [
    {
      question: "How do I update my profile information?",
      answer:
        "Open the profile page from the dashboard and use the profile update form to change your username or profile photo. Saved changes take effect immediately.",
    },
    {
      question: "Where can I see my unread messages?",
      answer:
        "Use the Messages section in the app navigation to view active chats, system notifications, and support requests. Reply directly from the message thread.",
    },
    {
      question: "How do I request a password change?",
      answer:
        "Submit a password change request from the profile page. An administrator will review and approve or reject your request.",
    },
    {
      question: "Can I access the help center without signing in?",
      answer:
        "Yes. This help page is available to all users, including visitors who are not signed in. Sign in to access your personalized dashboard content.",
    },
  ],
  admin: [
    {
      question: "How do I manage users and roles?",
      answer:
        "Use the dashboard tools to view and manage students, teachers, and parents. Admins can also review pending password requests and system reports.",
    },
    {
      question: "Where can I review school announcements?",
      answer:
        "Announcements are published from the dashboard and appear in the announcements section. You can also create new announcements if you have admin access.",
    },
    {
      question: "How do I view financial summaries?",
      answer:
        "The Finance page shows fee collections, outstanding balances, and payment history. Use the reports and charts to monitor school finances in real time.",
    },
  ],
  teacher: [
    {
      question: "How do I upload exam questions?",
      answer:
        "Navigate to the exam uploads page, submit your question files, and wait for administrator approval. Approved uploads become available to students based on the selected class.",
    },
    {
      question: "How can I track attendance?",
      answer:
        "Use the attendance section to mark student presence and review historical attendance data. Attendance summaries are available for each lesson and date range.",
    },
    {
      question: "Where do I see my assigned classes and subjects?",
      answer:
        "Your profile page shows the classes and subjects assigned to you. The dashboard also displays your recent lessons and teaching activity.",
    },
  ],
  parent: [
    {
      question: "How can I view my child’s academic progress?",
      answer:
        "Visit the profile page for your child to view results, attendance records, and fee assignments tailored to their academic year and class.",
    },
    {
      question: "How do I order books for my child?",
      answer:
        "The book orders section lets you select available textbooks and submit purchase requests. Track order status from the parent dashboard.",
    },
    {
      question: "How do I contact my child’s teacher?",
      answer:
        "Use the messaging feature to send direct messages to teachers or support staff. All communication is logged securely within the app.",
    },
  ],
  student: [
    {
      question: "How do I check my latest grades?",
      answer:
        "Your student profile page includes recent grade results and termly report summaries. Review the score details and remarks for each subject.",
    },
    {
      question: "Where can I see my class schedule?",
      answer:
        "The class schedule is available in your dashboard, including lesson times, subjects, and assigned teachers. Check the lesson feed for updates.",
    },
    {
      question: "What should I do if I forget my password?",
      answer:
        "Submit a password change request from your profile page. An administrator will process the request and notify you when it is approved.",
    },
  ],
};

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-shadow duration-200 hover:shadow-lg">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
        {question}
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-200 group-open:bg-sky-600 group-open:text-white">
          View
        </span>
      </summary>
      <div className="mt-4 text-sm leading-7 text-slate-700">{answer}</div>
    </details>
  );
}

export default async function HelpPage() {
  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? null;
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Guest";
  const roleFaqs = role && faqs[role as keyof typeof faqs] ? faqs[role as keyof typeof faqs] : [];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-950/20 sm:px-12">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Help Center</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Everything you need to use the School Management System.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Find answers and guidance for your role, whether you’re an administrator, teacher, parent, or student. This page is designed to help you access common tasks quickly and confidently.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Link href="/list/messages" className="rounded-3xl bg-slate-800 px-5 py-4 text-left transition hover:bg-slate-700">
              <p className="text-sm text-sky-300">Support</p>
              <p className="mt-2 text-base font-semibold text-white">Send a message</p>
            </Link>
            <Link href="/profile" className="rounded-3xl bg-slate-800 px-5 py-4 text-left transition hover:bg-slate-700">
              <p className="text-sm text-sky-300">Profile</p>
              <p className="mt-2 text-base font-semibold text-white">Manage account</p>
            </Link>
            <Link href="/list/announcements" className="rounded-3xl bg-slate-800 px-5 py-4 text-left transition hover:bg-slate-700">
              <p className="text-sm text-sky-300">Announcements</p>
              <p className="mt-2 text-base font-semibold text-white">School updates</p>
            </Link>
            <Link href="/list/events" className="rounded-3xl bg-slate-800 px-5 py-4 text-left transition hover:bg-slate-700">
              <p className="text-sm text-sky-300">Events</p>
              <p className="mt-2 text-base font-semibold text-white">View calendar</p>
            </Link>
            <Link href="/profile" className="rounded-3xl border border-slate-700 bg-slate-900 px-5 py-4 text-left transition hover:border-sky-400 hover:bg-slate-800">
              <p className="text-sm text-sky-300">Password requests</p>
              <p className="mt-2 text-base font-semibold text-white">Request a password change</p>
              <p className="mt-3 text-sm text-slate-400">Submit and track your pending password request from your profile.</p>
            </Link>
            <Link href="/list/fees" className="rounded-3xl border border-slate-700 bg-slate-900 px-5 py-4 text-left transition hover:border-sky-400 hover:bg-slate-800">
              <p className="text-sm text-sky-300">Fee support</p>
              <p className="mt-2 text-base font-semibold text-white">Review payment details</p>
              <p className="mt-3 text-sm text-slate-400">Access fee billing info, assignments, and payment history.</p>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Your access</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900">{displayRole} help</h2>
                </div>
                <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
                  Available to all users
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Use the FAQ below to quickly find answers for your role and common app workflows. If you are not signed in, these articles help you get started with the system.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Frequently Asked Questions</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Expand any question to see step-by-step guidance and links to the most important pages.
                </p>
                <div className="mt-6 space-y-4">
                  {faqs.general.map((item) => (
                    <AccordionItem key={item.question} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </div>

              {roleFaqs.length > 0 ? (
                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-xl font-semibold text-slate-900">{displayRole} FAQs</h3>
                  <div className="mt-6 space-y-4">
                    {roleFaqs.map((item) => (
                      <AccordionItem key={item.question} question={item.question} answer={item.answer} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-2xl shadow-slate-950/10">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Need help fast?</p>
              <h3 className="mt-4 text-2xl font-semibold">Contact support</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Use the messages page to raise a support request with the school administrator. Your message is sent directly within the system.
              </p>
              <Link
                href="/list/messages"
                className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Open messages
              </Link>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Quick tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Bookmark this page for quick access to commonly asked questions.</li>
                <li>• Use the search bar in your dashboard to find classes, reports, and announcements.</li>
                <li>• Keep your profile details up to date for better communication.</li>
              </ul>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Getting started</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                If you are new to the system, sign in and explore your role-specific dashboard to find tools for managing classes, attendance, fees, and communication.
              </p>
              <div className="mt-6 grid gap-3">
                <Link href="/" className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  Return to homepage
                </Link>
                <Link href="/profile" className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  Profile settings
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
