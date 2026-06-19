# Fix Supabase SignUp 500 Error

## Problem

`POST /auth/v1/signup` returns HTTP 500. The client-side code (`authService.ts`, `AuthContext.tsx`, `Login.tsx`) is correct - the error originates from the **Supabase server**.

Common causes for a 500 on `/auth/v1/signup`:

1. **Email/SMTP provider not configured** in Supabase Dashboard - this is the most common cause
2. **Database trigger on `auth.users`** that fails (e.g., a trigger that creates a profile row with mismatched columns/constraints)
3. **RLS policies** on the `usuarios` table blocking inserts during signup
4. **Supabase service outage** (check status.supabase.com)

## Plan

### Step 1: Improve client-side error handling in `src/services/authService.ts`

- Add retry logic (1 retry with 1s delay) for `AuthRetryableFetchError` (transient network errors)
- Extract more detail from the error object when available
- Log the HTTP status code if available

### Step 2: Improve user-facing error messages in `src/pages/Login/Login.tsx`

- Detect 500-class errors and show a more helpful message like "Servidor temporariamente indisponivel. Tente novamente." instead of the raw technical error

### Step 3: Manual Supabase Dashboard checks (cannot be done via code)

The developer must verify:

1. **Authentication > Providers > Email**: Ensure SMTP is configured (Supabase built-in email or custom SMTP like SendGrid/Resend)
2. **Authentication > Settings**: Check "Confirm email" setting - if enabled, SMTP must work
3. **Database > Triggers**: Check for triggers on `auth.users` that might be failing
4. **Database > RLS Policies**: Check INSERT policies on `usuarios` table allow new signups
5. **Logs > Auth**: Check server-side error details in Supabase dashboard

## Files to modify

| File | Change |
|------|--------|
| `src/services/authService.ts` | Add retry logic, better error extraction |
| `src/pages/Login/Login.tsx` | Show user-friendly message for 500 errors |

## Verification

1. Check Supabase Dashboard > Logs > Auth for the actual 500 error detail
2. Apply code changes for better error handling
3. Test signup flow in browser with DevTools Network tab open
