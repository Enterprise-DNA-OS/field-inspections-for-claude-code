# Inspection record checks

These checks support responsible review. They do not certify an asset, replace a competent inspector, determine legal compliance or notify a regulator. The free base does not make safety decisions. The dates below are operator policy dates, never invented statutory deadlines.

Sources checked 17 November 2026:

| Check | Source and scope | Implemented behaviour |
|---|---|---|
| NZ-IPP5 | [Privacy Commissioner, principle 5](https://www.privacy.org.nz/privacy-principles/5/): reasonable safeguards for personal information. | Flag missing or overdue access review dates. This does not inspect actual permissions or encryption. |
| NZ-IPP9 | [Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/): retain personal information only while needed for a lawful purpose. | Flag a missing purpose or missing/overdue retention review. Never delete automatically. Legal holds and other retention duties require human consideration. |
| LOCAL-ACTION | [WorkSafe, reviewing control measures](https://www.worksafe.govt.nz/managing-health-and-safety/businesses/general-requirements-for-workplaces/general-risk-and-workplace-management-part-2/): review whether controls remain effective. | Flag unverified corrective actions past their operator-set due date. The due date and verification process are local policy, not a statutory rule. |
| LOCAL-OWNER | Local inspection procedure. | Flag unassigned corrective actions. An owner is required before resolution. |
| LOCAL-EVIDENCE | Local inspection procedure. | Flag inspections without evidence for the current revision. Review also needs an assessor, a different reviewer and verified critical actions. |

An action is open, resolved, then verified by a different named operator. A changed finding or observation increments the parent revision, invalidating its earlier review and evidence. Previously verified actions remain historical facts unless explicitly reopened or changed by import. A new review checks the current overall record.

Imported source status is retained for reference and never treated as local verification. Supporting files remain in separately controlled storage; the database holds references and SHA-256 hashes. Hashes only identify supplied bytes, not whether the evidence is true. Seed evidence is explicitly fictional.

This is a trusted-operator application. Actor names are supplied by operators; database administrators can alter records and logs. It is not tamper-proof. RLS and revoked public privileges prevent default public access, but owner credentials bypass those restrictions. Configure individual authentication, least privilege, encrypted transport, backups, retention and customer-specific access before shared use. Do not expose an owner connection through a web page.

The NZ policy examples must be reviewed for each business and jurisdiction. Australian deployments need an agreed policy mapping before these checks are relied on. No payroll, payments, engineering sign-off, regulator filing or automatic notification is implemented.
