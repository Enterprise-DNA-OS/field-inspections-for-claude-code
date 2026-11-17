# /add-inspection

Read CLAUDE.md. Run `npm run inspections -- add-inspection --project=NORTH --code=NEW-01 --title="Inspection" --asset=CUL-20 --assessor="Inspector" --observed_on=2026-11-17 --due_on=2026-11-20 --actor="Operator"` after replacing example values with operator-supplied values. Use today's actual dates for new work. Add `--json` when processing the result.

Present the returned records and any blockers. Never infer a missing owner, date, observation or evidence.

For writes, use the real operator name for --actor and read the affected record first. If references are ambiguous, show candidates and ask which one. A recorded review is not a safety certificate.
