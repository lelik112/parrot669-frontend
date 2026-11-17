"""One authorized five-case WebKit event diagnostic; no product changes."""
import datetime, hashlib, json, os, pathlib, shutil, signal, subprocess, tempfile, time
root=pathlib.Path.cwd()
out=root/'diagnostic-evidence'
out.mkdir(exist_ok=True)
started=time.monotonic()
deadline=started+600
source='d1fd07f4bc1ab41bd5adc9de6822f0d355961b11'
def utc(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def hashes(base, names):
    return {n:hashlib.sha256((base/n).read_bytes()).hexdigest() for n in names}
names=subprocess.check_output(['git','ls-tree','-r','--name-only',source],text=True).splitlines()
baseline=hashes(root,names)
work=pathlib.Path(tempfile.mkdtemp(prefix='pr12-six-',dir=os.environ.get('RUNNER_TEMP','/tmp')))
for n in names:
    dest=work/n
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/n,dest)
(work/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
changes=[]
for name in ('host-period-editor.spec.cjs','http-session.spec.cjs','auth-messaging.spec.cjs'):
    p=work/'tests/e2e'/name
    before=p.read_text()
    needle="require('@playwright/test')" if name=='host-period-editor.spec.cjs' else "require('./isolated-fixture.cjs')"
    assert before.count(needle)==1, name
    after=before.replace(needle,"require('./instrument.cjs')")
    p.write_text(after)
    changes.append({'path':str(p.relative_to(work)),'before':hashlib.sha256(before.encode()).hexdigest(),'after':hashlib.sha256(after.encode()).hexdigest()})
shutil.copy2(root/'.github/diagnostics/pr12-webkit-d7668/instrument.cjs',work/'tests/e2e/instrument.cjs')
changed={x['path'] for x in changes}
frozen=[n for n in names if n not in changed]
assert hashes(work,frozen)=={n:baseline[n] for n in frozen}
versions={}
for package in ('@playwright/test','playwright','playwright-core'):
    versions[package]=json.loads((root/'node_modules'/package/'package.json').read_text())['version']
    assert versions[package]=='1.63.0'
manifest={'source':source,'diagnosticCommit':os.environ.get('GITHUB_SHA'),'started':utc(),
          'versions':versions,'diagnosticImports':changes,'cases':[],
          'networkPolicy':'synthetic API/browser guards before navigation; no live credentials; runner network enabled for dependencies',
          'sourceFileCount':len(names),'frozenBefore':True}
def save():
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2))
save()
cfg=work/'playwright.diagnostic.cjs'
cfg.write_text("""const base=require('./playwright.config.cjs');
module.exports={...base,workers:1,retries:0,forbidOnly:true,globalTimeout:40000,updateSnapshots:'none',
reporter:[['line'],['json',{outputFile:process.env.DIAG_JSON}]],
outputDir:process.env.DIAG_TMP,
use:{...base.use,trace:'off',screenshot:'off',video:'off'},
webServer:{...base.webServer,reuseExistingServer:false}};
""")
cases=[
('cancel','tests/e2e/host-period-editor.spec.cjs:13','^workspace disclosure/editor geometry 320/en$','webkit-desktop'),
('save','tests/e2e/host-period-editor.spec.cjs:41',None,'webkit-desktop'),
('preview','tests/e2e/http-session.spec.cjs:53',None,'webkit-desktop'),
('verification','tests/e2e/http-session.spec.cjs:4',None,'mobile-emulation'),
('messaging','tests/e2e/auth-messaging.spec.cjs:181','^S3 Host B real keyboard and retained draft 390/en$','mobile-emulation')]

env=os.environ.copy()
env['CI']='true'
# No user browser profile or stored state is passed. Every test uses Playwright's fresh context.
cli=[str(root/'node_modules/.bin/playwright'),'test']
def run(args, log, env, limit):
    with log.open('w') as f:
        p=subprocess.Popen(args,cwd=work,env=env,stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
        try: return p.wait(timeout=limit)
        except subprocess.TimeoutExpired:
            os.killpg(p.pid,signal.SIGTERM)
            try: p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(p.pid,signal.SIGKILL);p.wait()
            return 124
def count_tests(suites):
    return sum(sum(len(s.get('tests',[])) for s in suite.get('specs',[]))+count_tests(suite.get('suites',[])) for suite in suites)
failed=False
try:
    for family,selector,grep,project in cases:
        if deadline-time.monotonic()<300:
            manifest['stop']='Remaining bounded time insufficient for another selection';failed=True;break
        base=cli+[selector,'--config=playwright.diagnostic.cjs','--project='+project,'--workers=1','--retries=0']
        if grep: base+=['--grep',grep]
        case={'family':family,'selector':selector,'grep':grep,'project':project,'started':utc()}
        manifest['cases'].append(case)
        env['DIAG_EVENTS']=str(out/(family+'-events.json'))
        env['DIAG_JSON']=str(out/(family+'.json'))
        env['DIAG_TMP']=str(work/('generated-'+family))
        listing=out/(family+'-list.txt')
        rc=run(base+['--list','--reporter=json'],listing,env,20)
        case['listExit']=rc
        if rc!=0: manifest['stop']='Selection listing failed';failed=True;save();break
        listing_data=json.loads(listing.read_text())
        count=count_tests(listing_data.get('suites',[]));case['selectedCount']=count
        if count!=1: manifest['stop']='Selector does not resolve to exactly one test';failed=True;save();break
    assert len(manifest['cases'])==5 and all(c.get('selectedCount')==1 for c in manifest['cases']), 'Five selections not qualified'
    save()
    for case,(family,selector,grep,project) in zip(manifest['cases'],cases):
        base=cli+[selector,'--config=playwright.diagnostic.cjs','--project='+project,'--workers=1','--retries=0']
        if grep: base+=['--grep',grep]
        env['DIAG_EVENTS']=str(out/(family+'-events.json'))
        env['DIAG_JSON']=str(out/(family+'.json'))
        env['DIAG_TMP']=str(work/('generated-'+family))
        log=out/(family+'.txt')
        rc=run(base,log,env,45)
        case['exit']=rc;case['finished']=utc();failed=failed or rc!=0
        print('DIAGNOSTIC',family,'exit',rc,flush=True)
        # Emit bounded assertion evidence immediately even if later artifact upload is interrupted.
        text=log.read_text(errors='replace')
        print(text[-18000:],flush=True)
        if hashes(work,frozen)!={n:baseline[n] for n in frozen}:
            manifest['stop']='Unexpected source/baseline mutation';failed=True;save();break
        if rc==124:
            manifest['stop']='Invocation exceeded hard diagnostic timeout';failed=True;save();break
        save()
finally:
    manifest['finished']=utc()
    manifest['originalSourceUnchanged']=hashes(root,names)==baseline
    manifest['frozenCopyUnchanged']=hashes(work,frozen)=={n:baseline[n] for n in frozen}
    manifest['executedCount']=sum('exit' in c for c in manifest['cases'])
    save()
    # Only the temporary diagnostic directory created above is removed; original evidence stays in out.
    shutil.rmtree(work)
if not manifest['originalSourceUnchanged'] or not manifest['frozenCopyUnchanged']: raise SystemExit(2)
raise SystemExit(1 if failed else 0)

