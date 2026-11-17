insert into projects(id,code,name,owner,purpose,access_review_on,retention_review_on) values
 ('10000000-0000-4000-8000-000000000001','NORTH','North harbour drainage','Mere Wilson','Inspection assurance',current_date-8,current_date+180),
 ('10000000-0000-4000-8000-000000000002','SOUTH','South ridge structures','Alex Chen','Asset condition review',current_date+60,current_date-4),
 ('10000000-0000-4000-8000-000000000003','WEST','West reserve assets','Ravi Patel','Asset inspection planning',current_date+60,current_date+180)
 on conflict do nothing;
insert into inspections(id,code,project_id,title,asset,assessor,observed_on,due_on,latitude,longitude,revision,reviewed_revision,reviewer) values
 ('20000000-0000-4000-8000-000000000001','IN-001','10000000-0000-4000-8000-000000000001','Culvert outlet inspection','CUL-18','Mere Wilson',current_date-12,current_date-5,-36.8,174.7,1,null,null),
 ('20000000-0000-4000-8000-000000000002','IN-002','10000000-0000-4000-8000-000000000001','Culvert follow-up inspection','CUL-18','Ravi Patel',current_date-3,current_date+2,-36.8,174.7,2,1,'Alex Chen'),
 ('20000000-0000-4000-8000-000000000003','IN-003','10000000-0000-4000-8000-000000000002','Bridge bearing inspection','BR-09','Alex Chen',current_date-2,current_date+3,null,null,1,null,null),
 ('20000000-0000-4000-8000-000000000004','IN-004','10000000-0000-4000-8000-000000000002','Retaining wall inspection','RW-03','Ravi Patel',current_date-8,current_date-2,-41.2,174.8,1,1,'Mere Wilson')
 on conflict do nothing;
insert into findings(id,inspection_id,code,title,defect_type,severity,owner,due_on,state,resolution,resolved_by,verification,verified_by) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','FN-001','Outlet remains obstructed','blockage','critical','Mere Wilson',current_date-7,'open',null,null,null,null),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','FN-002','Outlet blockage seen again','blockage','high','Ravi Patel',current_date+1,'open',null,null,null,null),
 ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','FN-003','Bearing photograph missing','evidence','medium','',current_date-1,'open',null,null,null,null),
 ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003','FN-004','Drain cleaned; check result','drainage','high','Alex Chen',current_date-2,'resolved','Crew report recorded','Alex Chen',null,null),
 ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000004','FN-005','Marker replaced','marking','low','Ravi Patel',current_date-4,'verified','Replacement recorded','Ravi Patel','Site check complete','Mere Wilson') on conflict do nothing;
insert into evidence(id,inspection_id,revision,reference,sha256,actor) values
 ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',1,'fixtures/site-note.txt','SEED_HASH','Demo operator'),
 ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',1,'fixtures/site-note.txt','SEED_HASH','Demo operator'),
 ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004',1,'fixtures/site-note.txt','SEED_HASH','Demo operator') on conflict do nothing;
