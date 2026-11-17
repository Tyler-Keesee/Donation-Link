# Donation Link (Stripe Checkout test-mode prototype)

This is a small Express + Stripe Checkout donation demo. **Not production-ready.** The original server failed at startup by using `app` before initialization, loaded environment variables too late, and used an obsolete Stripe.js redirect method.

## Windows 11 PowerShell setup, one command at a time

Install Git and Node.js 22 LTS. Use a **Stripe test secret key**, never a live key in this sample.

```powershell
git clone https://github.com/Tyler-Keesee/Donation-Link.git
```
```powershell
Set-Location .\Donation-Link
```
```powershell
node --version
```
```powershell
npm --version
```
```powershell
npm ci
```
```powershell
Copy-Item .env.example .env
```
```powershell
notepad .env
```

Edit `.env` on your **own PC** with your Stripe test secret key from Stripe Dashboard, then save it. Do not post secrets in chat or commit the file.

```powershell
npm test
```
```powershell
npm start
```

Open **http://127.0.0.1:3000/**. Submit a test donation using Stripe's published test cards. Stop the server with Ctrl+C.

## Security and production blockers

- This sample **refuses live Stripe secret keys** by design, listens on localhost only, and is for test mode.
- The backend checks that donation amounts are whole cents between $0.50 and $5000.00.
- Browser navigation uses the Checkout Session URL returned by Stripe, rather than removed `redirectToCheckout` methods.
- A redirect to `/success` is **not proof of payment**. Real deployments require verified Stripe webhook handling, appropriate persistence, rate limiting, and deployment configuration before accepting real money.
- Keep `STRIPE_SECRET_KEY` in `.env` only and do not share or commit it.
- This repository's GitHub Pages branch can only serve static files; GitHub Pages **cannot run Express**. Run locally or deploy to a server that supports Node.js once thoroughly reviewed.

## Verification

`npm test` mocks Stripe Checkout and tests validation/response logic without contacting Stripe. It does not prove a real Stripe test transaction completed.

## Updating an existing clone

```powershell
git pull --ff-only
```
```powershell
npm ci
```
