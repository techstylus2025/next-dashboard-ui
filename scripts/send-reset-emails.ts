import fs from "fs/promises";
import path from "path";

async function sendViaFile(messages: string[]) {
  const outFile = path.join(process.cwd(), "scripts", "migration-output", "reset_emails.txt");
  await fs.writeFile(outFile, messages.join("\n"), "utf8");
  console.log(`Wrote ${messages.length} reset messages to ${outFile}`);
}

async function sendViaSmtp(messages: { to: string; subject: string; text: string }[]) {
  let nodemailer;
  try {
    nodemailer = await import("nodemailer");
  } catch (err) {
    console.warn("nodemailer not installed; falling back to file output");
    return sendViaFile(messages.map((m) => `To: ${m.to}\nSubject: ${m.subject}\n\n${m.text}`));
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || `no-reply@${process.env.NEXT_PUBLIC_SITE_DOMAIN || "example.com"}`;

  if (!host || !user || !pass) {
    console.warn("SMTP config missing; falling back to file output");
    return sendViaFile(messages.map((m) => `To: ${m.to}\nSubject: ${m.subject}\n\n${m.text}`));
  }

  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
  for (const m of messages) {
    try {
      await transporter.sendMail({ from, to: m.to, subject: m.subject, text: m.text });
      console.log(`Sent reset email to ${m.to}`);
    } catch (err) {
      console.error(`Failed to send to ${m.to}:`, err);
    }
  }
}

async function main() {
  const file = path.join(process.cwd(), "scripts", "migration-output", "reset_tokens.json");
  try {
    const content = await fs.readFile(file, "utf8");
    const data: Record<string, string> = JSON.parse(content || "{}");
    const messages = Object.entries(data).map(([userId, token]) => {
      const base = process.env.RESET_URL_BASE || `https://your-app.example.com/auth/reset`;
      const url = `${base}?token=${token}`;
      return { to: userId, subject: "Password reset", text: `Reset your password: ${url}` };
    });

    if (messages.length === 0) {
      console.log("No reset tokens found.");
      return;
    }

    if (process.env.SMTP_HOST) {
      await sendViaSmtp(messages);
    } else {
      await sendViaFile(messages.map((m) => `To: ${m.to} -- Reset URL: ${m.text}`));
    }
  } catch (err) {
    console.error("No reset tokens found or error:", err);
  }
}

main();
