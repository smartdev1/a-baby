# `infra/ci/`

- **Owner:** backend developer
- **Status:** Prepared — T-007 (not active)

## Role

Continuous integration, prepared but not enabled: a workflow in `.github/workflows/` runs as soon as it is pushed, and enabling CI is an owner decision.

## How it works

`ci.yml` runs on every pull request and on `main`, on **Ubuntu and Windows**: frozen pnpm install (store cached), then `pnpm verify`:

| Check                                                                                        | Command          |
| -------------------------------------------------------------------------------------------- | ---------------- |
| ESLint (sizes, complexity, no `any`, no floating promises)                                   | `pnpm lint`      |
| Package boundaries (dependency-cruiser)                                                      | `pnpm lint`      |
| Repo checks (Role headers, folder READMEs, ≤ 12 source files per folder, no catch-all names) | `pnpm lint`      |
| TypeScript strict on every package                                                           | `pnpm typecheck` |
| Unit tests + map pipeline golden test (identical bytes on both OSes)                         | `pnpm test`      |

Content validation (`content-cli`) is added when content exists (J3). No secret, no deployment.

## Enable it (owner)

```bash
mkdir -p .github/workflows && cp infra/ci/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "ci: enable GitHub Actions"
```

Optionally pin the actions by commit SHA and make the `verify` jobs required in the branch protection of `main`.

## Run the same checks locally

```bash
pnpm verify
```
