"""Real Firefox regression suite; start Vite on :5174 and geckodriver on :4444.
Uses Python's standard library, an isolated profile, and disposable localStorage.
Run: python3 tests/browser_regression.py
"""
import argparse, atexit, base64, json, pathlib, tempfile, time, urllib.request

parser=argparse.ArgumentParser()
parser.add_argument('--app-url',default='http://127.0.0.1:5174/')
parser.add_argument('--webdriver',default='http://127.0.0.1:4444')
args=parser.parse_args()
APP_URL=args.app_url
ARTIFACTS=pathlib.Path(__file__).resolve().parents[1]/'.tools/browser-regression'
ARTIFACTS.mkdir(parents=True,exist_ok=True)
profile=tempfile.mkdtemp(prefix='profile-',dir=ARTIFACTS)
capabilities={'capabilities':{'alwaysMatch':{'browserName':'firefox','moz:firefoxOptions':{'args':['-headless','-profile',profile]}}}}
request=urllib.request.Request(args.webdriver+'/session',data=json.dumps(capabilities).encode(),headers={'Content-Type':'application/json'})
with urllib.request.urlopen(request,timeout=60) as response:
 session=json.load(response)['value']['sessionId']
BASE=args.webdriver+'/session/'+session
def req(path,data=None,method=None):
 r=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json'},method=method)
 try:
  with urllib.request.urlopen(r,timeout=45) as response:return json.load(response)['value']
 except urllib.error.HTTPError as e: raise RuntimeError(e.read().decode())
def js(code,*args):return req('/execute/sync',{'script':code,'args':list(args)})
def wait(code):
 for _ in range(100):
  if js('return '+code): return
  time.sleep(.05)
 raise AssertionError(code)
def el(selector):return req('/element',{'using':'css selector','value':selector})['element-6066-11e4-a52e-4f735466cecf']
def click(selector):req('/element/'+el(selector)+'/click',{})
def text(selector,value):req('/element/'+el(selector)+'/value',{'text':value})
def keys(*values):
 a=[]
 for value in values:
  if isinstance(value,tuple):
   for v in value:a.append({'type':'keyDown','value':v})
   for v in reversed(value):a.append({'type':'keyUp','value':v})
  else:a += [{'type':'keyDown','value':value},{'type':'keyUp','value':value}]
 req('/actions',{'actions':[{'type':'key','id':'keys','actions':a}]})
def button(label):
 settings_labels={'Directory guides','Ancestor titles','Unchecked branch bars','Expanded branch bars','Leaf drawings','Export JSON','Import JSON','Export Markdown','Import Markdown'}
 in_settings=label in settings_labels
 if in_settings and js('return document.querySelector(".settings-trigger")?.getAttribute("aria-expanded")==="false"'):
  click('.settings-trigger')
 ident=js('return [...document.querySelectorAll("button")].find(b=>(b.textContent===arguments[0] || b.getAttribute("aria-label")===arguments[0]) && !b.closest("[inert]") && b.getClientRects().length && (!b.closest("details") || b.closest("details").open))',label)
 assert ident,label
 js('arguments[0].scrollIntoView({block:"nearest",inline:"nearest"})',ident)
 for _ in range(40):
  if js('const b=arguments[0],r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest("button")===b',ident):break
  time.sleep(.05)
 else:raise AssertionError('Button remained covered: '+label)
 req('/element/'+ident['element-6066-11e4-a52e-4f735466cecf']+'/click',{})
 if in_settings: click('.settings-heading button')
def load(nodes,url=None):
 if url is None: url=APP_URL
 req('/url',{'url':url}); wait('document.querySelector("main") !== null')
 js('localStorage.setItem("branchfold.tree.v1",JSON.stringify({version:1,nodes:arguments[0]}))',nodes)
 req("/refresh",{})
 wait('document.querySelector("main") !== null')
def stored():return js('return JSON.parse(localStorage.getItem("branchfold.tree.v1")).nodes')

def close_session():
 try: req('',method='DELETE')
 except Exception: pass
atexit.register(close_session)
# Markdown and JSON feed one independent editor tree.
source = "# Project\n\nIntro context\n\n- [ ] Parent\n  - [x] Child\n\n  Notes stay here.\n\n- [ ] Other\n\n```md\n- [ ] Code example\n```\n"
fixture_path = ARTIFACTS / 'markdown-plan.md'
fixture_path.write_text(source)
load([{'id':'existing','title':'Existing','done':False,'children':[]}])
assert js('return document.querySelector(".workspace").classList.contains("directory-guides")')
assert js('return document.querySelector(".workspace").classList.contains("leaf-drawings")')
text('input[aria-label="Markdown import"]', str(fixture_path))
wait('document.querySelector(".import-preview") !== null')
button('Replace tree')
assert [n['title'] for n in stored()] == ['Parent', 'Other']
assert stored()[0]['children'][0]['title'] == 'Child'
assert 'Intro context' not in js('return document.body.textContent')
assert js('return [...document.querySelectorAll("button")].some(b=>b.textContent === "Open Markdown view")') is False
click('input[data-node-id]');keys(*' edited');keys('\ue00c')
assert stored()[0]['title'] == 'Parent edited'
button('Node control Parent edited')
assert js('return document.querySelectorAll("input[data-node-id]").length') == 2
button('Node control Parent edited')
button('Focus subtree Parent edited')
assert js('return document.querySelectorAll("input[data-node-id]").length') == 2
button('All tasks')
# Append roots with distinct IDs; repeated imports must not collide.
js('const s=document.querySelector(arguments[0]);s.value="append";s.dispatchEvent(new Event("change",{bubbles:true}))', 'select[aria-label="Import mode"]')
text('input[aria-label="Markdown import"]', str(fixture_path));wait('document.querySelector(".import-preview") !== null');button('Append tasks')
assert len(stored()) == 4
assert len({n['id'] for n in stored()}) == 4
button('Undo');assert len(stored()) == 2
# Capture export content without sending it anywhere or writing to Downloads.
js('window.originalCreateURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.exportedBlob=blob;return window.originalCreateURL(blob)};HTMLAnchorElement.prototype.click=function(){}')
button('Export Markdown')
exported=req('/execute/async',{'script':'const done=arguments[arguments.length-1];window.exportedBlob.text().then(done);','args':[]})
assert exported == '- [ ] Parent edited\n  - [x] Child\n- [ ] Other\n'
assert fixture_path.read_text() == source
(ARTIFACTS/'markdown-editor.png').write_bytes(base64.b64decode(req('/screenshot')))
req('/refresh',{});wait('document.querySelector("main") !== null')
assert stored()[0]['title'] == 'Parent edited'
print('PASS: unified Markdown import/edit/export, default visuals, append/replace, undo, focus, reload, original-file preservation')
