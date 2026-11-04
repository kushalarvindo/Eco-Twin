import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const python=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';
if(!existsSync(python)){console.error('Create .venv and install backend/requirements.txt first. See README.md.');process.exit(1)}
const run=spawnSync(python,['backend/manage.py','test','core','--verbosity','2'],{stdio:'inherit'});
process.exit(run.status??1);
