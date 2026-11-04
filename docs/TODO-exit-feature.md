# Exit / Foya feature: open items and nice-to-haves

Status: the feature itself is finished (DB migration, backend, frontend, tests).
This list is what is still worth doing. Order = my suggested priority.

## A. Do soon (safety / correctness)
- [ ] **`db/aws-credentials.txt` is tracked in git.** Rotate the credentials, remove the file from git
      (`git rm --cached`), add it to `.gitignore`. Old commits still contain it: rotating matters more than deleting.
- [ ] **JWT fallback secret `'supersecretkey'`**: remove the fallback, fail on start if `JWT_SECRET` is missing.
- [ ] **Set `yurt.timezone` per yurt** (migration default is `Europe/Berlin`, a guess). Kurallar tab > Yurt saat dilimi.
- [ ] **Stale compiled `.js` files** sit next to the `.ts` files and shadow them unless `tsc --watch` runs.
      Either keep `npm run build` running, or stop compiling into the source folders (`outDir: dist`).
- [ ] **Migration sections 5 and 6** (delete test rows, drop duplicate tables) are still commented out.
      Run them after a backup, once you are sure.

## B. Cleanup
- [ ] `exit_settings` table is unused ("look at it later"): drop it or use it.
- [ ] Add the API test script (32 checks: isolation, deadlines, roles, concurrency) to the repo, e.g. `backend/tests/`.
- [ ] Bootstrap (CDN) vs Tailwind: the project overview mentions Tailwind, the app uses Bootstrap. Pick one.
- [ ] `frontend-1/` is ignored so far: decide whether to delete it.
- [ ] Frontend production bundle is about 711 kB gzipped: route-level code splitting (`React.lazy`).
- [ ] `frontend/build` could not be deleted by the build tool from the sandbox: delete it by hand before the next build.

## C. Features that could be added later
- [ ] Realtime updates for exits (WebSocket, see `WEBSOCKET-FEATURE-IDEAS.md`): today the page refreshes every 60 s.
- [ ] Features of the old exit UI that were not carried over (it stays in git history): check if any is missed.
- [ ] Fixed reason categories instead of free text (grouping is by text, ignoring case and spaces).
- [ ] Notifications for students who are overdue (push / mail to Hoca).
- [ ] Export (CSV / PDF) of history, fouls and duration summaries.
- [ ] Audit trail: who recorded / edited / deleted a log (today only `created_by` is stored).
- [ ] Parent-facing view or report per talebe.

## D. Checks before going live
- [ ] Manual test with real login, sidebar and a real yurt (admin switching yurts, hoca, yoklamaci).
- [ ] Backup of `saray_appdb` before running the migration on a real database.
- [ ] Confirm roles: only Admin / SuperAdmin manage rules and time zone.
