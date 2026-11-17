import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
export async function seed(db){
 const hash=createHash('sha256').update(fs.readFileSync(path.join(REPO_ROOT,'fixtures/site-note.txt'))).digest('hex');
 await db.exec('BEGIN');try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8').replaceAll('SEED_HASH',hash));await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const db=await getDb();try{await seed(db);console.log('seed: fictional inspection records ready');}finally{await db.close();}}
