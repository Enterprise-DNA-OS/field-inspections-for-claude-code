# Move inspection records from Fulcrum

Keep Fulcrum available until counts, relationships, attachments and the agreed daily work have been checked. A supported CSV import is one command; a complete field operation also requires an agreed collection method.

## Export

With export permission, use Fulcrum's Exports menu or the app's download icon. Select CSV and include the required records. Download the archive and extract it locally. Retain the original archive, media and history separately.

Vendor instructions checked 17 November 2026: [Export methods](https://help.fulcrumapp.com/en/articles/73547-how-to-download-or-export-data), [system metadata](https://help.fulcrumapp.com/en/articles/75973-what-does-the-system-level-metadata-look-like), [repeatable sections](https://help.fulcrumapp.com/en/articles/93346-understanding-data-exports-formatting-with-repeatable-sections).

A parent record carries fulcrum_id. Repeatable children carry fulcrum_parent_id. Fulcrum exports each repeatable section separately. This importer accepts one parent inspection file and one optional child findings file per invocation. It reads UTF-8 CSV, including BOM, quoted commas, CRLF and multiline fields. Extract ZIP files first; XLSX is not accepted directly.

## Map the app's fields

Fulcrum apps have custom fields; there is no universal inspection form. The fixture names are examples, not a claim about every export. Map your columns once in imports/field-map.json:

```json
{"inspections":{"title":"inspection_name","asset":"asset_number","assessor":"inspector_name","observed_on":"inspection_date","due_on":"review_due"},"findings":{"defect_type":"issue_type","severity":"risk_rating","owner":"action_owner"}}
```

| Destination | Defaults | Rule |
|---|---|---|
| Source identity | fulcrum_id or _record_id | Required and unique per source app; preserved as text. |
| Child relationship | fulcrum_parent_id or _parent_id | Parent must exist within the same source app and project. |
| Inspection | title, asset, assessor, observed_on, due_on | Title, asset, observation date and due date required. Dates must be YYYY-MM-DD; future observations rejected. Missing assessor blocks local review. |
| Location | latitude, longitude or underscored equivalents | Both absent or a valid pair in geographic degrees. No coordinate conversion. |
| Child finding | title, defect_type, severity, owner, due_on | Severity must be low, medium, high or critical. Missing owner is retained and flagged. |
| Source completion | status or _status | Stored for reference only. Local actions start open and inspections need review. |
| All other fields | Original column names | Retained inside source_data, including media references. |

Normalize date formats and custom severity labels in a working copy before import. Keep the original export. Missing required fields fail the entire transaction; the importer never invents dates, assets or owners. A mapping file selects column names, not value transformations. Use a stable --app value for repeat imports and one destination project per import.

## Load and reconcile

Create the project with add-project, then test the import:

```bash
npm run inspections -- import fulcrum --project=NORTH --app=drainage-inspections --file=imports/inspections.csv --findings=imports/findings.csv --map=imports/field-map.json --actor="Your name" --dry-run --json
```

Remove --dry-run for the real import. Omit --findings or --map when unnecessary. The dry run checks the whole batch and rolls back all records and audit events. Added, updated and unchanged counts are returned. Compare parent and child counts, several source IDs, original fields and project coverage before switching.

Repeating identical rows does not overwrite local work. Changed source rows require --update and invalidate the affected inspection review. Changed child rows reopen their local action. Missing rows are never deleted. A child cannot silently move to another parent. Review mapping changes separately: identical source rows are treated as unchanged. Duplicate IDs and orphan children reject the whole batch.

## Separate migration work

The free importer stores raw fields and media references, not photo/audio/video bytes, maps, signatures, line/polygon geometry, linked-app relationships, form rules or full history events. Attach locally reviewed evidence with attach-evidence. Only repeatable sections that represent findings fit the child mapping; other sections need an explicit extension. Enterprise DNA scopes that mapping and any mobile, offline or mapping connection into the customised version. Do not cancel Fulcrum until these needs are accounted for.

Export produces a private JSON snapshot of all five domain record sets, including evidence hashes, original fields and activity. It is portable data, not a substitute for tested database and media backups. This version does not include an automated snapshot restore command.
