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
 ident=js('return [...document.querySelectorAll("button")].find(b=>(b.textContent===arguments[0] || b.getAttribute("aria-label")===arguments[0]) && !b.closest("[inert]") && b.getClientRects().length && (!b.closest("details") || b.closest("details").open))',label)
 assert ident,label
 js('arguments[0].scrollIntoView({block:"nearest",inline:"nearest"})',ident)
 for _ in range(40):
  if js('const b=arguments[0],r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest("button")===b',ident):break
  time.sleep(.05)
 else:raise AssertionError('Button remained covered: '+label)
 req('/element/'+ident['element-6066-11e4-a52e-4f735466cecf']+'/click',{})
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
# Upload a disposable mixed-content document; navigation must never mutate it.
source = "# Project\n\nIntro context\n\n- [ ] Parent\n  - [x] Child\n\n  Notes stay here.\n\n- [ ] Other\n\n```md\n- [ ] Code example\n```\n"
fixture_path = ARTIFACTS / 'markdown-plan.md'
fixture_path.write_text(source)
load([{'id':'legacy','title':'Legacy task','done':False,'children':[]}])
original = js('return localStorage.getItem("branchfold.tree.v1")')
button('Open Markdown view')
text('input[type=file]', str(fixture_path))
wait('document.querySelectorAll(".md-task").length === 3')
assert js('return document.querySelector(".md-heading").textContent') == 'Project'
button('Collapse Parent')
assert js('return document.querySelectorAll(".md-task").length') == 2
button('Expand Parent')
button('Focus Parent')
assert js('return document.querySelectorAll(".md-task").length') == 2
button('All tasks')
button('Detailed context')
assert js('return [...document.querySelectorAll("pre")].some(p=>p.textContent.includes("Code example"))')
click('.md-task')
keys('\ue015')
wait('document.activeElement.textContent.includes("Child")')
assert fixture_path.read_text() == source
assert js('return localStorage.getItem("branchfold.tree.v1")') == original
screenshot = req('/screenshot')
(ARTIFACTS/'markdown-reader.png').write_bytes(base64.b64decode(screenshot))
button('Legacy JSON editor')
assert js('return document.querySelector("input[data-node-id]").value') == 'Legacy task'
print('PASS: real Firefox Markdown upload, context, folding, focus, keyboard, source and JSON preservation')
