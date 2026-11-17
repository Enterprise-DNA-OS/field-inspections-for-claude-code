# /import

Read CLAUDE.md. Run `npm run inspections -- import fulcrum --project=NORTH --app=drainage --file=fixtures/fulcrum-inspections.csv --findings=fixtures/fulcrum-findings.csv --dry-run --actor="Operator"` after replacing example values with operator-supplied values. Use today's actual dates for new work. Add `--json` when processing the result.

Keep the source backup. Start with --dry-run. Compare parent and child counts. Only remove --dry-run after the operator requests the import. Changed source rows need explicit --update; imported status never certifies local review.

For writes, use the real operator name for --actor and read the affected record first. If references are ambiguous, show candidates and ask which one. A recorded review is not a safety certificate.
