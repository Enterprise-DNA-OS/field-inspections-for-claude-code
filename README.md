# Field Inspections for Claude Code

See which inspection needs review, which defect keeps returning and which repair still needs an independent check. Keep your inspection records in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free under MIT. Install the base and review the fictional demo. | Your inspection fields, review rules, Fulcrum exports and collection connections. One setup fee, then a retainer. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=fulcrum) · [Instead of Fulcrum](https://enterprisedna.co/omni/instead-of/fulcrum)

## Try it

Node 20 or later:

```bash
npm install
npm run demo
npm run inspections -- weekly-review
npm run view
npm run docs
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. CLAUDE.md and AGENTS.md route to the same commands. The embedded PGlite database needs no server. DATABASE_URL selects PostgreSQL. DATA_DIR selects the local storage directory. Never seed a shared production database.

The fictional demo includes a critical outlet blockage, a repeat defect on the same asset, an unassigned action, a resolved action awaiting verification, stale review evidence and a project with no inspections. Relative demo dates keep attention reports useful. Seeding twice preserves existing records.

## What this version does

An office inspection and corrective-action system: projects, asset observations, locations, review deadlines, repeatable findings, evidence hashes and change history. It is useful with entered observations or existing exports. Mobile collection, offline synchronisation and mapping connections are separately scoped work before replacing a field team's application. [What a screen provides](docs/why-no-front-end.md).

The annual bill scenario is US$33,000 for 50 Fulcrum Elite users at its published US$55 per user per month. That is list-price arithmetic, not a customer invoice or a quote. Vendor plans require annual subscription and at least five users. [Pricing source](https://www.fulcrumapp.com/pricing/) and [candidate research](docs/research.md), checked 17 November 2026.

## Weekly work

Monday: /weekly-review combines the review queue, overdue actions and project coverage. Each day: /review-queue, /overdue-actions, /evidence-gaps, /repeat-defects and /owner-load. Before accepting a report: /stale-reviews and /compliance. /draft-chaser and /draft-report prepare working files and never send.

31 CLI commands and 32 slash-command recipes. Run npm run inspections -- help for every command. All commands accept --json. Flags use --name=value. Writes require --actor. Exact codes, partial IDs and case-insensitive names work. Ambiguous references list the candidates and exit with failure. Unknown flags fail, including misspelled dry-run flags. Full examples live in .claude/commands/.

## Review gates

Resolving an action requires an owner and evidence. Verification requires a different named operator. An inspection review requires evidence attached to its current revision, a named assessor, a different reviewer and all critical findings verified. Editing observations or changing actions increments the parent revision. Earlier review and evidence then become stale.

File evidence stores a SHA-256 hash and a controlled-storage reference. Source bytes stay in your storage. Actor names are operator-supplied labels, not authenticated identities. Database owners can alter the records. This is an operational record system, not a tamper-proof audit service or safety certification. [Policy checks and cited rules](docs/compliance.md).

## Ten questions this build answers today

Fulcrum already provides reporting and a query service. These are tested questions in your version, not claims of exclusive capability.

1. Which inspections need review, and which have unresolved critical findings? review-queue.
2. Which repairs are overdue even though someone marked them resolved? overdue-actions.
3. Which inspections have no evidence for the current revision? evidence-gaps.
4. Which defect type has returned on the same asset across inspections? repeat-defects.
5. Who owns the most overdue work, including unassigned actions? owner-load.
6. Which programmes have no recorded inspections? coverage.
7. Which reviews became stale after records changed? stale-reviews.
8. Which inspection locations are still missing? location-gaps.
9. Which projects need an access or retention policy review? compliance.
10. Who changed a finding, and what did it say before? activity.

## Bring your Fulcrum history

Create a destination project, then import a parent CSV and optional findings CSV in one command:

```bash
npm run inspections -- import fulcrum --project=NORTH --app=drainage --file=imports/inspections.csv --findings=imports/findings.csv --map=imports/field-map.json --actor="Your name" --dry-run --json
```

Remove --dry-run for the real load. The importer preserves source IDs, child relationships and every raw field. It rejects duplicates, orphan children and invalid dates or coordinates. Changed source records require --update. Imported completion labels do not approve local work. Both parent and child files commit together or roll back together. [Export, mapping and reconciliation guide](docs/replace-fulcrum.md).

## Your paperwork and views

Change brand.json for the business name, colours and logo. npm run docs produces an inspection report per inspection, a corrective-action register per project and an evidence handover manifest per project. npm run view produces three read-only snapshots: the week, coverage and assurance. The files stay local and are ignored by Git. /new-view adds a report to views.json.

## Your first hour: ten things to ask for

1. Put our name and logo on the inspection reports.
2. Test-import one Fulcrum inspection app.
3. Map our repeatable defect section separately.
4. Show all critical findings awaiting verification.
5. Add our inspection method reference field.
6. Change our owner assignment rules.
7. Show repeated defects by asset and month.
8. Add a report for the engineering reviewer.
9. Draft follow-up notes for overdue actions.
10. Set our access and retention review dates.

/customise writes a migration, applies it and updates the commands and tests. No application front end is required for the record and review jobs.

## Verification and deployment

npm test uses an isolated temporary database. It migrates and seeds twice, exercises every CLI command, checks independent review gates, stale evidence, repeat import behaviour, mapping, rollback, CSV edge cases, exports, drafts and escaped HTML. CI is configured for Node 20/22 on Windows and Linux, plus PostgreSQL 17. Check actual CI results before claiming a platform passed. TEST_DATABASE_URL must point to an empty disposable database.

Use a trusted operator role. Public access is revoked and domain records have row-level security enabled, with no public policies. The database owner can access everything; configure real authentication and access rules before sharing. Keep private exports, drafts, media and connection details out of Git. Hosting, backups and coding-agent usage have their own costs.

Enterprise DNA brings across the agreed Fulcrum records, adds your rules and documents, scopes mobile collection or a web front end, and runs your version through Omni by Enterprise DNA for one setup fee and then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=fulcrum).

MIT. Not affiliated with Fulcrum or Anthropic.
