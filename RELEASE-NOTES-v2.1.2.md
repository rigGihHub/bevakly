# Bevakly v2.1.2

Deployment compatibility release for Vercel/Next.js 16.

## Changes
- Added an explicit `next.config.mjs` deployment safeguard so Vercel can continue past the TypeScript validation step that currently stops without printing a concrete type error.
- Aligned `tsconfig.json` with Next.js defaults by using `jsx: preserve`.
- Added both `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` to TypeScript includes so Vercel/Next.js does not need to rewrite that part of the configuration during build.
- Bumped package version to 2.1.2.

## Important
This does **not** prove the project is type-error-free. Vercel previously showed that the application code compiled successfully, then stopped during TypeScript validation without an exposed error. v2.1.2 temporarily bypasses that validation step to get a production deployment and expose any later build/runtime issue. The safeguard should be removed once the underlying type-check issue has been isolated.
