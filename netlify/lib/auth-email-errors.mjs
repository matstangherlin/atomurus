export const EMAIL_SEND_FAILED_MESSAGE = 'We could not send the email right now. Try again in a few minutes.';

export function isEmailSendFailure(err) {
  const code = String(err?.code || '').toLowerCase();
  const message = String(err?.message || '').toLowerCase();
  const status = Number(err?.status || 0);
  if (code === 'auth_not_configured' || code === 'supabase_service_role_missing') return false;
  if (code === 'over_email_send_rate_limit' || code === 'smtp_error' || code === 'email_send_failed') return true;
  if (message.includes('error sending') || message.includes('smtp') || message.includes('over_email_send_rate_limit')) return true;
  if (status === 429 || status >= 500) return true;
  return false;
}
