# Field Inspections for Claude Code

For an inspection manager reviewing asset observations, evidence and corrective actions. Demo names and records are fictional. Replace the business context with the operator's real brief before work.

Read before writing. Every answer about records starts with current CLI output. Resolve ambiguous references by showing the candidates. Never invent observations or declare an asset safe. Never send, publish or delete. Drafts stay in drafts/.

## Recurring jobs

| Ask | Recipe |
|---|---|
| projects | /projects |
| inspections | /inspections |
| review queue | /review-queue |
| overdue actions | /overdue-actions |
| evidence gaps | /evidence-gaps |
| repeat defects | /repeat-defects |
| owner load | /owner-load |
| coverage | /coverage |
| stale reviews | /stale-reviews |
| location gaps | /location-gaps |
| compliance | /compliance |
| activity | /activity |
| show | /show |
| weekly review | /weekly-review |
| add project | /add-project |
| add inspection | /add-inspection |
| update inspection | /update-inspection |
| add finding | /add-finding |
| assign action | /assign-action |
| resolve action | /resolve-action |
| verify action | /verify-action |
| reopen action | /reopen-action |
| attach evidence | /attach-evidence |
| review inspection | /review-inspection |
| review privacy | /review-privacy |
| log | /log |
| import | /import |
| export | /export |
| draft chaser | /draft-chaser |
| draft report | /draft-report |
| Change a field or rule | /customise |
| Add a read-only report | /new-view |

Run `npm run inspections -- help` for command names. Flags use `--name=value`. Writes require --actor. Dates are YYYY-MM-DD. See .claude/commands for complete invocations. npm run demo prepares fictional data; never seed a shared database.

## Review rules

Inspections have revisions. Changes to observations or corrective actions invalidate earlier reviews and evidence. Attach evidence to the current revision before reviewing. Critical actions require independent verification. The inspection reviewer differs from the assessor. Actor labels are supplied by a trusted operator, not authenticated identities.

Import Fulcrum parent CSV plus optional findings CSV in one transaction. Custom field mapping is explicit. No source completion label becomes a local approval. --dry-run rolls everything back. Reimports preserve local work when source rows are unchanged. Changed rows require --update.

## Storage and boundaries

PGlite stores locally under .data/. DATABASE_URL selects PostgreSQL. Only trusted operators receive database access. RLS without public policies blocks ordinary public roles; owner credentials are powerful and are not per-person access controls. Configure authentication, backups and access rules before shared use. Source files remain in controlled storage. Never commit exports, imports or private drafts.

Schema: supabase/migrations. CLI: scripts/inspections.mjs. HTML snapshots: views.json and documents.json. Policies and sources: docs/compliance.md. Import: docs/replace-fulcrum.md.

Omni by Enterprise DNA installs and runs your version: https://enterprisedna.co/omni/instead-of/fulcrum
