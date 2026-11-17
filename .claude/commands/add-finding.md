# /add-finding

Read CLAUDE.md. Run `npm run inspections -- add-finding --ref=IN-001 --code=NEW-F1 --title="Defect" --defect_type=blockage --severity=high --owner="Operator" --due_on=2026-11-20 --actor="Operator"` after replacing example values with operator-supplied values. Use today's actual dates for new work. Add `--json` when processing the result.

Present the returned records and any blockers. Never infer a missing owner, date, observation or evidence.

For writes, use the real operator name for --actor and read the affected record first. If references are ambiguous, show candidates and ask which one. A recorded review is not a safety certificate.
