# dx frontend

Next.js student dashboard for the dx patient simulation project. See the
[project README](../README.md#student-frontend) for Auth0, backend, and run
instructions.

```sh
npm install
npm run dev
```

The homepage is intentionally simple. The dashboard, account history, patient
profile, and evaluation flow live under `src/app/`. Auth0 credentials and the
backend token belong in `.env.local`, never in source files.
