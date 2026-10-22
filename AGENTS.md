<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

## Project rule: every page has `loading.tsx` and `error.tsx`

Every route that has a `page.tsx` must have a `loading.tsx` and an `error.tsx` in the same folder. Adding a page without both is incomplete. Check with `find app -name page.tsx` against the `loading.tsx` / `error.tsx` lists.

**`loading.tsx`**
- Build it from the shadcn `Skeleton` (`@/components/ui/skeleton`). No spinners or "Loading..." text.
- It must look like the page: copy the page's wrapper elements, grid, spacing and typography classes exactly, so nothing shifts when the data arrives. Static copy (headings, subtitles, labels, table headers, buttons) renders as real text; only values that come from the session or database are skeletons. Show disabled buttons for actions.
- Reuse the helpers in `components/app/skeletons.tsx` (`TableSkeleton`, `StatCardSkeleton`, `FieldSkeleton`, `BackLinkSkeleton`, `InlineSkeleton`). When a page has a bigger reusable skeleton (for example `AdminOverviewSkeleton`, `PeopleSkeleton`), use it in both `loading.tsx` and the page's `<Suspense fallback>` so they can't drift. Share static header markup the same way (see `PeopleHeader`).
- When you change a page's layout, update its `loading.tsx` in the same change.
- Keep the fallback deterministic: no `Date.now()` or `Math.random()`, and don't render `{children}` in it.

**`error.tsx`**
- It is a Client Component (`"use client"`) that renders `RouteError` from `@/components/app/route-error`, passing `error`, `retry`, and a `backHref` / `backLabel` that leads somewhere sensible for that area. Don't write bespoke error UI per page.
- In this Next.js version the props are `{ error: unknown; retry: () => void }`. Use `retry()` to recover. `reset()` exists but only clears the error state without refetching, so avoid it.
- An `error.tsx` doesn't catch errors thrown by the layout in the same segment, only by its page and children.

**Data access and Suspense**
- `cacheComponents` is on. Anything that reads the session (`requireUser` / `requireAdmin` / `getCurrentUser`), `cookies()`, `headers()` or the database must run behind `<Suspense>`. `loading.tsx` provides a segment-level boundary. When a page has static content (a title, subtitle), keep that outside and put an explicit `<Suspense fallback={<...Skeleton />}>` around only the async part.

## Project rule: icons are Phosphor

- Icons come from `@phosphor-icons/react` (`components.json` has `iconLibrary: "phosphor"`). Lucide is removed; don't add it back.
- Names end in `Icon` (`PlusIcon`, `SignOutIcon`).
- In files **without** `"use client"` (pages, layouts, `loading.tsx`, other server components), import from `@phosphor-icons/react/ssr`. The default entry uses React context and fails the build in server components with `createContext is not a function`. Client components import from `@phosphor-icons/react`.
