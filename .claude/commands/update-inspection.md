# /update-inspection

Read CLAUDE.md. Run `npm run inspections -- update-inspection --ref=IN-001 --title="Corrected inspection description" --actor="Operator"` after replacing example values with operator-supplied values. Use today's actual dates for new work. Add `--json` when processing the result.

Present the returned records and any blockers. Never infer a missing owner, date, observation or evidence.

For writes, use the real operator name for --actor and read the affected record first. If references are ambiguous, show candidates and ask which one. A recorded review is not a safety certificate.
