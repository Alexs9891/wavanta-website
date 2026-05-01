# Wavanta Website

A Vercel-ready one-page marketing website for Wavanta.

## What is included

- `index.html` - homepage content and inline SVG icon system
- `styles.css` - visual design system, layout and responsiveness
- `api/contact.js` - Vercel contact form endpoint using Resend
- `vercel.json` - clean URLs, redirects, cache headers and security headers

## Contact Form Setup

The form posts to `/api/contact` and sends enquiries to `hello@wavanta.ai` once these Vercel environment variables are configured:

- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`

`CONTACT_FROM_EMAIL` should be a verified sender in Resend.

## Assets

The live site uses three assets in `/assets`:

- `favicon.png`
- `wavanta-logo-white.png`
- `wavanta-gradient-banner.png`

If this repository is connected directly to Vercel, upload those three assets into an `assets` folder before deploying from GitHub.
