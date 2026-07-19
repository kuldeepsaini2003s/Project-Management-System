import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const { host, port, secure, user, pass } = env.smtp;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: user.trim(), pass: pass.replace(/\s+/g, "") },
  });
  return transporter;
};

export const verifyEmailTransport = async () => {
  const tx = getTransporter();
  if (!tx) return;
  try {
    await tx.verify();
  } catch {}
};

const escapeHtml = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const sendTeamInviteEmail = async ({
  to,
  inviteUrl,
  teamName,
  inviterName,
  expiresAt,
}) => {
  const tx = getTransporter();
  if (!tx) return false;

  const safeTeam = escapeHtml(teamName);
  const safeInviter = escapeHtml(inviterName || "A teammate");
  const expires = new Date(expiresAt).toLocaleString();

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1d1b19">
    <h2 style="margin:0 0 12px;font-size:18px">You're invited to join ${safeTeam}</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5f574e">
      ${safeInviter} invited you to collaborate on the <strong>${safeTeam}</strong> team in ${escapeHtml(
    env.appName
  )}.
    </p>
    <a href="${inviteUrl}"
       style="display:inline-block;background:#5b63d3;color:#fff;text-decoration:none;
              padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600">
      Accept invitation
    </a>
    <p style="margin:16px 0 0;font-size:12px;color:#9a928a">
      This invitation expires on ${expires}.
    </p>
  </div>`;

  const text = `${safeInviter} invited you to join the "${teamName}" team in ${env.appName}.
Open the email and click "Accept invitation" to join.
This invitation expires on ${expires}.`;

  await tx.sendMail({
    from: env.smtp.from,
    to,
    subject: `Join ${teamName} on ${env.appName}`,
    text,
    html,
  });
  return true;
};
