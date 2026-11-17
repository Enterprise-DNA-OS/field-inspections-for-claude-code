create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table projects (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, owner text not null,
 purpose text not null default '', access_review_on date, retention_review_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table inspections (
 id uuid primary key default gen_random_uuid(), code text not null unique, project_id uuid not null references projects,
 title text not null, asset text not null, assessor text not null default '', observed_on date not null, due_on date not null,
 latitude numeric check(latitude between -90 and 90), longitude numeric check(longitude between -180 and 180),
 revision integer not null default 1 check(revision>0), reviewed_revision integer, reviewer text, review_note text,
 source_app text, source_id text, source_status text, source_data jsonb not null default '{}',
 unique(source_app,source_id), check((latitude is null)=(longitude is null)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table findings (
 id uuid primary key default gen_random_uuid(), inspection_id uuid not null references inspections, code text not null unique,
 title text not null, defect_type text not null, severity text not null check(severity in ('low','medium','high','critical')),
 owner text not null default '', due_on date not null, state text not null default 'open' check(state in ('open','resolved','verified')),
 resolution text, resolved_by text, verification text, verified_by text,
 source_id text, source_data jsonb not null default '{}', unique(inspection_id,source_id),
 check(state='open' or (nullif(trim(resolution),'') is not null and nullif(trim(resolved_by),'') is not null)),
 check(state<>'verified' or (nullif(trim(verification),'') is not null and nullif(trim(verified_by),'') is not null and lower(trim(verified_by))<>lower(trim(resolved_by)))),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table evidence (
 id uuid primary key default gen_random_uuid(), inspection_id uuid not null references inspections,
 revision integer not null, reference text not null, sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), entity_id uuid, actor text not null, action text not null,
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index findings_inspection on findings(inspection_id);
create index evidence_inspection on evidence(inspection_id,revision);
create index inspections_project on inspections(project_id);
do $$ declare t text; begin foreach t in array array['projects','inspections','findings','evidence','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
end loop; end $$;
create view inspection_review as
 select i.id,i.code,p.code as project,i.title,i.asset,i.assessor,i.observed_on,i.due_on,i.revision,
 case when i.reviewed_revision=i.revision then 'reviewed' else 'needs review' end as review_state,
 (select count(*)::int from evidence e where e.inspection_id=i.id and e.revision=i.revision) as current_evidence,
 (select count(*)::int from findings f where f.inspection_id=i.id and f.state<>'verified') as pending_actions,
 (select count(*)::int from findings f where f.inspection_id=i.id and f.state<>'verified' and f.severity='critical') as critical_actions
 from inspections i join projects p on p.id=i.project_id;
create view action_register as
 select f.id,f.code,i.code as inspection,p.code as project,i.asset,f.title,f.defect_type,f.severity,f.owner,f.due_on,f.state,
 greatest(current_date-f.due_on,0) as days_overdue
 from findings f join inspections i on i.id=f.inspection_id join projects p on p.id=i.project_id;
create view project_coverage as
 select p.code,p.name,p.owner,count(i.id)::int as inspections,
 count(i.id) filter(where i.reviewed_revision=i.revision)::int as reviewed,
 max(i.observed_on) as last_observed_on,
 count(i.id) filter(where i.reviewed_revision is distinct from i.revision and i.due_on<current_date)::int as overdue_reviews
 from projects p left join inspections i on i.project_id=p.id group by p.id;
create view compliance_flags as
 select p.code as record,'NZ-IPP5' as rule,'Access review missing or overdue' as reason from projects p where p.access_review_on is null or p.access_review_on<current_date
 union all select p.code,'NZ-IPP9','Retention purpose or review missing or overdue' from projects p where trim(p.purpose)='' or p.retention_review_on is null or p.retention_review_on<current_date
 union all select code,'LOCAL-ACTION','Unverified overdue corrective action' from findings where state<>'verified' and due_on<current_date
 union all select code,'LOCAL-OWNER','Corrective action has no owner' from findings where state<>'verified' and trim(owner)=''
 union all select code,'LOCAL-EVIDENCE','Inspection has no evidence for its current revision' from inspection_review where current_evidence=0;
