This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase Auth Setup

This app uses Supabase Auth for both email/password and Google sign-in.

### Required environment variables

These already exist in the app and must be configured in `.env.local` and your deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No new app-side environment variables are required for Google OAuth.

### Supabase Dashboard

In your Supabase project, enable the Google provider under `Authentication -> Providers -> Google`.

Set the provider values from Google Cloud Console:

- Google OAuth Client ID
- Google OAuth Client Secret

Add this redirect URL in Supabase under `Authentication -> URL Configuration`:

- `http://localhost:3000/auth/callback` for local development
- your production callback URL, for example `https://your-domain.com/auth/callback`

The app sends the user back to `/dashboard` after the OAuth callback completes.

### Google Cloud Console

Create an OAuth 2.0 Client ID for a Web application and add the same callback URL as an authorized redirect URI.

Use the same project values in the Supabase Google provider settings.
