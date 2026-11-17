#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const reports={
 projects:'select code,name,owner,access_review_on,retention_review_on from projects order by code',
 inspections:'select code,project,title,asset,review_state,pending_actions from inspection_review order by code',
 'review-queue':"select code,project,title,due_on,current_evidence,critical_actions from inspection_review where review_state='needs review' order by due_on,code",
 'overdue-actions':"select code,inspection,title,severity,owner,days_overdue,state from action_register where state<>'verified' and days_overdue>0 order by days_overdue desc,code",
 'evidence-gaps':"select code,title,revision,current_evidence from inspection_review where current_evidence=0 order by code",
 'repeat-defects':"select i.asset,f.defect_type,count(distinct i.id)::int as inspections,count(*)::int as findings from findings f join inspections i on i.id=f.inspection_id group by i.asset,f.defect_type having count(distinct i.id)>1 order by i.asset,f.defect_type",
 'owner-load':"select case when trim(owner)='' then '(unassigned)' else owner end as owner,count(*)::int as pending,count(*) filter(where days_overdue>0)::int as overdue from action_register where state<>'verified' group by owner order by overdue desc,owner",
 coverage:'select * from project_coverage order by code',
 'stale-reviews':"select code,title,revision,reviewed_revision from inspections where reviewed_revision is not null and reviewed_revision<>revision order by code",
 'location-gaps':"select code,title,asset from inspections where latitude is null order by code",
 compliance:'select * from compliance_flags order by record,rule',
 activity:'select entity_id,actor,action,detail,created_at from activity order by created_at,id'
};
const mutations=['add-project','add-inspection','update-inspection','add-finding','assign-action','resolve-action','verify-action','reopen-action','attach-evidence','review-inspection','review-privacy','log','import'];
export const commands=[...Object.keys(reports),'help','show','weekly-review',...mutations,'export','draft-chaser','draft-report'];
const needed=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}`);return o[k].trim();};
const today=()=>new Date().toISOString().slice(0,10);
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date: ${v}`);return v;}
function observed(v){date(v);if(v>today())throw Error('Observation date cannot be in the future');return v;}
function location(o){const a=o.latitude,b=o.longitude;if((a==null||a==='')&&(b==null||b===''))return [null,null];if(a==null||b==null||a===''||b===''||!Number.isFinite(Number(a))||!Number.isFinite(Number(b))||Math.abs(Number(a))>90||Math.abs(Number(b))>180)throw Error('Invalid latitude/longitude pair');return [Number(a),Number(b)];}
const hash=v=>createHash('sha256').update(v).digest('hex');
const canonical=v=>JSON.stringify(Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))));
async function match(db,kind,ref){
 if(!['projects','inspections','findings'].includes(kind))throw Error('Bad entity');
 if(typeof ref!=='string'||!ref.trim())throw Error(`Required reference for ${kind}`);
 const col=kind==='projects'?'name':'title';const rows=await db.query(`select * from ${kind} order by code`);const q=ref.trim().toLowerCase();
 const exact=rows.filter(r=>r.code.toLowerCase()===q||r.id===q);const found=exact.length?exact:rows.filter(r=>r.id.startsWith(q)||r[col].toLowerCase().includes(q)||r.code.toLowerCase().startsWith(q));
 if(found.length!==1)throw Error(found.length?`Ambiguous ${kind}:\n${found.map(r=>`${r.code} | ${r[col]} | ${r.id}`).join('\n')}`:`No ${kind} matches ${ref}`);
 return found[0];
}
async function audit(db,actor,action,id,detail){await db.query('insert into activity(actor,action,entity_id,detail) values($1,$2,$3,$4)',[actor,action,id,JSON.stringify(detail)]);}
async function invalidate(db,id){await db.query('update inspections set revision=revision+1 where id=$1',[id]);}
const INS_FIELDS=['title','asset','assessor','observed_on','due_on','latitude','longitude'];
async function insertInspection(db,o,project,source={}){
 const latlon=location(o);const values=[needed(o,'code'),project.id,needed(o,'title'),needed(o,'asset'),o.assessor||'',observed(needed(o,'observed_on')),date(needed(o,'due_on')),...latlon,source.app||null,source.id||null,source.status||null,JSON.stringify(source.raw||{})];
 return (await db.query('insert into inspections(code,project_id,title,asset,assessor,observed_on,due_on,latitude,longitude,source_app,source_id,source_status,source_data) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *',values))[0];
}
async function insertFinding(db,o,inspection,source={}){
 const severity=needed(o,'severity').toLowerCase();if(!['low','medium','high','critical'].includes(severity))throw Error('severity must be low, medium, high or critical');
 return (await db.query('insert into findings(code,inspection_id,title,defect_type,severity,owner,due_on,source_id,source_data) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[needed(o,'code'),inspection.id,needed(o,'title'),needed(o,'defect_type'),severity,o.owner||'',date(needed(o,'due_on')),source.id||null,JSON.stringify(source.raw||{})]))[0];
}
async function importFulcrum(db,o,pos,actor){
 if(pos[0]!=='fulcrum')throw Error('Usage: import fulcrum --project=CODE --app=NAME --file=export.csv [--findings=children.csv] [--map=mapping.json] [--dry-run] [--update] --actor=NAME');
 const project=await match(db,'projects',needed(o,'project'));const app=needed(o,'app');const map=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 const defaults={source_id:['fulcrum_id','_record_id'],parent_id:['fulcrum_parent_id','_parent_id'],title:['title'],asset:['asset'],assessor:['assessor'],observed_on:['observed_on'],due_on:['due_on'],latitude:['latitude','_latitude'],longitude:['longitude','_longitude'],status:['status','_status'],defect_type:['defect_type'],severity:['severity'],owner:['owner']};
 const scopes=map.inspections||map.findings?{inspections:map.inspections||{},findings:map.findings||{}}:{inspections:map,findings:map};
 for(const scope of Object.values(scopes))for(const [k,v] of Object.entries(scope)){if(!Object.hasOwn(defaults,k)||typeof v!=='string'||!v.trim())throw Error(`Invalid mapping: ${k}`);}
 let activeMap=scopes.inspections;
 const get=(r,k)=>activeMap[k]?pick(r,activeMap[k]):pick(r,...defaults[k]);
 const rows=parseCsv(fs.readFileSync(needed(o,'file'),'utf8'));if(!rows.length)throw Error('No inspection rows in CSV');
 const children=o.findings?parseCsv(fs.readFileSync(o.findings,'utf8')):[];const seen=new Set();const stats={inspections_added:0,inspections_updated:0,findings_added:0,findings_updated:0,unchanged:0,dry_run:!!o['dry-run']};
 for(const raw of rows){
  if(pick(raw,'fulcrum_parent_id','_parent_id'))throw Error('Parent file contains repeatable child rows');
  const sid=get(raw,'source_id');if(!sid||seen.has(sid))throw Error('Missing or duplicate inspection source ID');seen.add(sid);
  const val=Object.fromEntries(INS_FIELDS.map(k=>[k,get(raw,k)]));needed(val,'title');needed(val,'asset');observed(val.observed_on);date(val.due_on);location(val);
  let old=(await db.query('select * from inspections where source_app=$1 and source_id=$2',[app,sid]))[0];
  if(old&&old.project_id!==project.id)throw Error('Source record belongs to a different project');
  if(old&&canonical(old.source_data)===canonical(raw)){stats.unchanged++;continue;}
  if(old&&!o.update)throw Error(`Changed inspection ${sid}; review then use --update`);
  if(old){await db.query('update inspections set title=$1,asset=$2,assessor=$3,observed_on=$4,due_on=$5,latitude=$6,longitude=$7,source_status=$8,source_data=$9,revision=revision+1 where id=$10',[val.title,val.asset,val.assessor,val.observed_on,val.due_on,...location(val),get(raw,'status'),JSON.stringify(raw),old.id]);stats.inspections_updated++;}
  else{old=await insertInspection(db,{...val,code:`FC-${hash(app+'|'+sid).slice(0,16)}`},project,{app,id:sid,status:get(raw,'status'),raw});stats.inspections_added++;}
  await audit(db,actor,'import-inspection',old.id,{source_id:sid,before:old.source_data,after:raw});
 }
 const childSeen=new Set();activeMap=scopes.findings;
 for(const raw of children){
  const sid=get(raw,'source_id'),parent=get(raw,'parent_id');if(!sid||!parent||childSeen.has(sid))throw Error('Missing or duplicate finding ID or parent ID');childSeen.add(sid);
  const inspection=(await db.query('select * from inspections where source_app=$1 and source_id=$2 and project_id=$3',[app,parent,project.id]))[0];if(!inspection)throw Error(`Orphan finding ${sid}: parent ${parent} missing`);
  const val=Object.fromEntries(['title','defect_type','severity','owner','due_on'].map(k=>[k,get(raw,k)]));
  const moved=await db.query('select f.id from findings f join inspections i on i.id=f.inspection_id where i.source_app=$1 and f.source_id=$2 and f.inspection_id<>$3',[app,sid,inspection.id]);if(moved.length)throw Error(`Finding ${sid} changed parent`);
  const old=(await db.query('select * from findings where inspection_id=$1 and source_id=$2',[inspection.id,sid]))[0];
  if(old&&canonical(old.source_data)===canonical(raw)){stats.unchanged++;continue;}
  if(old&&!o.update)throw Error(`Changed finding ${sid}; review then use --update`);
  needed(val,'title');needed(val,'defect_type');date(val.due_on);if(!['low','medium','high','critical'].includes(val.severity))throw Error('Invalid imported severity');
  let row;
  if(old){row=(await db.query("update findings set title=$1,defect_type=$2,severity=$3,owner=$4,due_on=$5,source_data=$6,state='open',resolution=null,resolved_by=null,verification=null,verified_by=null where id=$7 returning *",[val.title,val.defect_type,val.severity,val.owner,val.due_on,JSON.stringify(raw),old.id]))[0];stats.findings_updated++;}
  else{row=await insertFinding(db,{...val,code:`FF-${hash(app+'|'+sid).slice(0,16)}`},inspection,{id:sid,raw});stats.findings_added++;}
  await invalidate(db,inspection.id);await audit(db,actor,'import-finding',row.id,{before:old||null,after:raw});
 }
 return stats;
}
async function mutate(db,c,o,pos){
 const actor=needed(o,'actor');
 if(c==='import')return importFulcrum(db,o,pos,actor);
 let before=null,row=null;
 if(c==='add-project')row=(await db.query('insert into projects(code,name,owner,purpose) values($1,$2,$3,$4) returning *',[needed(o,'code'),needed(o,'name'),needed(o,'owner'),needed(o,'purpose')]))[0];
 else if(c==='add-inspection')row=await insertInspection(db,o,await match(db,'projects',needed(o,'project')));
 else if(c==='review-privacy'){
  before=await match(db,'projects',needed(o,'project'));const evidence=needed(o,'evidence');row=(await db.query('update projects set purpose=$1,access_review_on=$2,retention_review_on=$3 where id=$4 returning *',[needed(o,'purpose'),date(needed(o,'access_review_on')),date(needed(o,'retention_review_on')),before.id]))[0];await audit(db,actor,'privacy-evidence',row.id,{evidence});
 }else if(c==='log'){
  before=await match(db,'inspections',needed(o,'ref'));row={id:before.id,note:needed(o,'note')};
 }else if(['add-finding','attach-evidence','review-inspection','update-inspection'].includes(c)){
  before=await match(db,'inspections',needed(o,'ref'));
  if(c==='add-finding'){row=await insertFinding(db,o,before);await invalidate(db,before.id);}
  if(c==='attach-evidence'){const sha=hash(fs.readFileSync(needed(o,'file')));row=(await db.query('insert into evidence(inspection_id,revision,reference,sha256,actor) values($1,$2,$3,$4,$5) returning *',[before.id,before.revision,needed(o,'reference'),sha,actor]))[0];}
  if(c==='review-inspection'){
   const [v]=await db.query('select * from inspection_review where id=$1',[before.id]);
   if(!v.current_evidence||v.critical_actions||!before.assessor.trim())throw Error('Review blocked: current evidence, assessor and verified critical actions required');
   if(before.assessor.trim().toLowerCase()===actor.toLowerCase())throw Error('Reviewer must differ from assessor');
   row=(await db.query('update inspections set reviewed_revision=revision,reviewer=$1,review_note=$2 where id=$3 returning *',[actor,needed(o,'evidence'),before.id]))[0];
  }
  if(c==='update-inspection'){
   const keys=INS_FIELDS.filter(k=>o[k]!==undefined);if(!keys.length)throw Error('No inspection fields supplied');
   const merged={...before,...Object.fromEntries(keys.map(k=>[k,o[k]]))};needed(merged,'title');needed(merged,'asset');observed(merged.observed_on);date(merged.due_on);const [latitude,longitude]=location(merged);merged.latitude=latitude;merged.longitude=longitude;
   row=(await db.query('update inspections set '+keys.map((k,i)=>`${k}=$${i+1}`).join(',')+`,revision=revision+1 where id=$${keys.length+1} returning *`,[...keys.map(k=>merged[k]),before.id]))[0];
  }
 }else{
  before=await match(db,'findings',needed(o,'ref'));
  if(c==='assign-action'){row=(await db.query("update findings set owner=$1,due_on=$2,state='open',resolution=null,resolved_by=null,verification=null,verified_by=null where id=$3 returning *",[needed(o,'owner'),date(needed(o,'due_on')),before.id]))[0];}
  if(c==='resolve-action'){
   if(before.state!=='open'||!before.owner.trim())throw Error('Only an owned open action can be resolved');
   row=(await db.query("update findings set state='resolved',resolution=$1,resolved_by=$2 where id=$3 returning *",[needed(o,'evidence'),actor,before.id]))[0];
  }
  if(c==='verify-action'){
   if(before.state!=='resolved')throw Error('Only a resolved action can be verified');if(before.resolved_by.trim().toLowerCase()===actor.toLowerCase())throw Error('Verifier must differ from resolver');
   row=(await db.query("update findings set state='verified',verification=$1,verified_by=$2 where id=$3 returning *",[needed(o,'evidence'),actor,before.id]))[0];
  }
  if(c==='reopen-action'){needed(o,'reason');row=(await db.query("update findings set state='open',resolution=null,resolved_by=null,verification=null,verified_by=null where id=$1 returning *",[before.id]))[0];}
  await invalidate(db,before.inspection_id);
 }
 if(!row)throw Error('Unknown mutation');await audit(db,actor,c,row.id,{before,after:row,reason:o.reason||null});return [row];
}
export async function run(db,c,o={},pos=[]){
 if(!commands.includes(c))throw Error(`Unknown command ${c}. Use help.`);
 const options={
 'add-project':['code','name','owner','purpose'], 'add-inspection':['project','code',...INS_FIELDS],
 'update-inspection':['ref',...INS_FIELDS], 'add-finding':['ref','code','title','defect_type','severity','owner','due_on'],
 'assign-action':['ref','owner','due_on'], 'resolve-action':['ref','evidence'], 'verify-action':['ref','evidence'],
 'reopen-action':['ref','reason'], 'attach-evidence':['ref','file','reference'], 'review-inspection':['ref','evidence'],
 'review-privacy':['project','purpose','access_review_on','retention_review_on','evidence'], log:['ref','note'],
 import:['project','app','file','findings','map','update'],show:['ref']
 };
 const allowed=new Set(['json',...(options[c]||[]),...(mutations.includes(c)?['actor','dry-run']:[])]);
 for(const k of Object.keys(o))if(!allowed.has(k))throw Error(`Unknown --${k} for ${c}`);
 for(const k of ['json','dry-run','update'])if(o[k]!==undefined&&o[k]!==true)throw Error(`--${k} is a boolean flag without a value`);
 if(c!=='import'&&pos.length)throw Error('Unexpected positional arguments');
 if(c==='help')return commands.map(command=>({command,write:mutations.includes(command)}));
 if(reports[c])return db.query(reports[c]);
 if(c==='show'){
  const i=await match(db,'inspections',needed(o,'ref'));
  return {inspection:i,findings:await db.query('select * from findings where inspection_id=$1 order by code',[i.id]),evidence:await db.query('select * from evidence where inspection_id=$1 order by created_at,id',[i.id])};
 }
 if(c==='weekly-review')return {queue:await run(db,'review-queue'),overdue:await run(db,'overdue-actions'),coverage:await run(db,'coverage')};
 if(mutations.includes(c)){
  await db.exec('BEGIN');try{
   // One operator transaction at a time also protects import identity and revision gates.
   await db.exec('LOCK TABLE projects,inspections,findings,evidence,activity IN SHARE ROW EXCLUSIVE MODE');
   const result=await mutate(db,c,o,pos);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
  }catch(e){await db.exec('ROLLBACK');throw e;}
 }
 if(c==='export'){
  const data={format:'field-inspections-v1',exported_at:new Date().toISOString()};await db.exec('BEGIN READ ONLY');
  try{for(const t of ['projects','inspections','findings','evidence','activity'])data[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`inspections-${randomUUID()}.json`);fs.writeFileSync(file,JSON.stringify(data,null,2),{mode:0o600});return {file,counts:Object.fromEntries(['projects','inspections','findings','evidence','activity'].map(t=>[t,data[t].length]))};
 }
 if(c.startsWith('draft-')){
  const rows=c==='draft-chaser'?await run(db,'overdue-actions'):await run(db,'review-queue');
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`${c}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# ${c==='draft-chaser'?'Corrective action follow-up':'Inspection review report'}\n\nWorking draft. Human review required.\n\n${render(rows)}\n`,{mode:0o600});return {file,records:rows.length};
 }
}
export function render(value){
 if(Array.isArray(value)){if(!value.length)return '(none)';return table(value.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v&&typeof v==='object'?JSON.stringify(v):v]))),Object.keys(value[0]).map(key=>({key,label:key.replaceAll('_',' '),width:48})));}
 return Object.entries(value).map(([key,v])=>`${key}:\n${v&&typeof v==='object'?render(v):v}`).join('\n');
}
export function parseArgs(args){const o={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(Object.hasOwn(o,k))throw Error(`Duplicate --${k}`);o[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {o,pos};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const {o,pos}=parseArgs(process.argv.slice(2));const c=pos.shift()||'help';db=await getDb();const result=await run(db,c,o,pos);console.log(o.json?JSON.stringify(result,null,2):render(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
