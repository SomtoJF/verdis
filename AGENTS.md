# Verdis demo context

## Business problem

The reference company helps people check their eligibility to move abroad, then sells them a full report. 92% of people who see their results leave without paying for the report. There is currently no way to tell who never tried to pay, who started and stopped, and whose payment failed.

## Demo scope

- This Verdis demo exists to show the CEO how Ferno could fit the reference company's eligibility-to-report funnel.
- Frontend-only Vite/React demo. No backend, real auth, real payments, or deployment work.
- Sign-in/signup creates fake local demo identity only.
- Ferno SDK instrumentation is intentionally deferred to a separate pass.
- Keep unrelated links as `#` stubs.

## Future instrumentation notes

Track behavior and outcomes, not form answers or payment details. Likely funnel events: opened checker, completed step, viewed results, opened checkout, attempted payment, payment succeeded, and payment failed.
