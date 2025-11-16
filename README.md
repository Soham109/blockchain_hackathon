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

## College Marketplace - local development & setup

This project includes early-stage implementations for:

- Email-based sign-up with verification tokens (server: `/api/auth/sendVerification` and `/api/auth/verifyEmail`).
-- Student ID upload and OCR/ML parsing (server: `/api/id/upload`). The server will try to call a multimodal model if you provide QWEN credentials; otherwise it falls back to Tesseract OCR. IMPORTANT: the server will NOT store the uploaded image. Instead it sends the image bytes to the configured multimodal model and stores only the returned JSON (the parsed fields / verification result) in MongoDB.

Required environment variables (see `.env.example`):

- `MONGODB_URI` - MongoDB connection string (use Atlas for prod).
- `JWT_SECRET` - secret for signing JWTs / sessions.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` - SMTP credentials for sending verification emails.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - image hosting.
- `QWEN_API_KEY`, `QWEN_API_URL`, `QWEN_MODEL` - optional: multimodal model to parse student IDs. If omitted, server uses Tesseract.js locally.
- `NEXT_PUBLIC_APP_URL` - e.g. `http://localhost:3000` used in verification links.

How to get the API keys you'll likely need:

- MongoDB Atlas: create a free cluster and get the connection string (replace user/pass in the string). Allow your IP or use 0.0.0.0/0 for development.
- SMTP: you can use Gmail (less secure app flow or App Passwords) or a provider like SendGrid/Mailgun. Use their SMTP settings for `SMTP_HOST` etc.
 - Email (Resend): we now prefer Resend for transactional emails. Create an account at https://resend.com and add `RESEND_API_KEY` and `RESEND_FROM` to your `.env.local`. The server will use Resend first and fall back to SMTP if Resend is not configured or fails.
- Cloudinary: sign up for a free account and get the cloud name + API key/secret.
- Qwen model (your choice): provide `QWEN_API_KEY` and `QWEN_API_URL`. The repo expects a simple JSON API that accepts `{ model, inputs: [...] }` where one input can be an `input_image` with an `image_url` and another an instruction `text` input. The exact payload may need to be adapted to the vendor you use. If you provide these keys the API will call the remote model; otherwise it falls back to local OCR.
 - Qwen model (your choice): provide `QWEN_API_KEY` and `QWEN_API_URL`. The repo expects a simple JSON API that accepts `{ model, inputs: [...] }` where one input can be an `input_image` with an `image` (base64 data URI) and another an instruction `text` input. The exact payload may need to be adapted to the vendor you use. If you provide these keys the API will call the remote model; otherwise it falls back to local OCR.

 - OpenRouter (recommended proxy for Qwen): instead of calling a vendor directly you can route requests through OpenRouter. Provide `OPENROUTER_API_KEY`, `OPENROUTER_API_URL` and `OPENROUTER_MODEL` in `.env.local`. The server will prefer OpenRouter if present and send the uploaded image as a base64 data URI to the router endpoint. Example env entries:

```
OPENROUTER_API_KEY=or-sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_URL=https://openrouter.ai/v1/responses
OPENROUTER_MODEL=qwen/qwen3-vl-235b-a22b-thinking
```

How to get an OpenRouter key:
- Go to https://openrouter.ai and sign up for an account.
- Create an API key in the dashboard (they provide a free tier / trial; check their site for limits).
- Use that key in `OPENROUTER_API_KEY` and set `OPENROUTER_API_URL` to the OpenRouter responses/create endpoint. If you host your own OpenRouter instance, use its URL.

Notes on payload compatibility:
- Providers differ in the exact JSON shape. The code sends a conservative payload of the form `{ model, inputs: [ {type:'input_image', image: '<datauri>'}, {type:'text', text:'<instruction>'} ] }` which works with many LLM multimodal routers. If the provider expects a different shape, paste their example and I'll adapt the request shape.

Dev flow for email verification and ID upload (happy path):

1. POST `/api/auth/sendVerification` with `{ email, role }` to request a verification email. Check your SMTP inbox and click the link.
2. The link calls the front-end `verify-email` page which should call POST `/api/auth/verifyEmail` with `{ token }`.
3. After email is verified, the front-end should let the user upload a student ID image to POST `/api/id/upload` (multipart/form-data, field name `file`) and include `x-user-id` header with the user id. The image itself is not persisted by the server — only the model's JSON response is stored.

Next steps (I'll implement these if you'd like):

- Sign-up stepper UI (email -> ID upload -> marketplace onboarding)
- Frontend pages and components: beautiful landing page, browse, product pages, seller dashboard
- Product CRUD, search, filters, reviews, messaging
- Payment integration (Stripe) with order recording
- Admin dashboard and verification workflow (manual review)

