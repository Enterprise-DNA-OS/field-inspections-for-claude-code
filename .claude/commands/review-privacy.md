# /review-privacy

Read CLAUDE.md. Run `npm run inspections -- review-privacy --project=NORTH --purpose="Inspection assurance" --access_review_on=2027-01-01 --retention_review_on=2027-11-01 --evidence="Policy review record" --actor="Operator"` after replacing example values with operator-supplied values. Use today's actual dates for new work. Add `--json` when processing the result.

Present the returned records and any blockers. Never infer a missing owner, date, observation or evidence.

For writes, use the real operator name for --actor and read the affected record first. If references are ambiguous, show candidates and ask which one. A recorded review is not a safety certificate.
