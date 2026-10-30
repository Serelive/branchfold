"""Real Firefox regression suite; start Vite on :5174 and geckodriver on :4444.
Uses Python's standard library, an isolated profile, and disposable localStorage.
Run: python3 tests/browser_appearance.py
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

load([{'id':'a','title':'保留原文 Original','done':False,'children':[]}])
assert js('return document.querySelector(".settings-trigger").getAttribute("aria-expanded")')=='false'
assert js('return document.querySelector(".settings-panel").hidden')
click('.settings-trigger')
click('.setting-toggle input')
click('input[aria-label="Chinese mode"]')
assert js('return document.documentElement.dataset.theme')=='dark'
assert js('return document.documentElement.lang')=='zh-CN'
assert js('return document.querySelector(".toolbar h2").textContent')=='你的任务树'
assert stored()[0]['title']=='保留原文 Original'
for width in [1200,390]:
 req('/window/rect',{'width':width,'height':844})
 rect=js('const r=document.querySelector(".settings-panel").getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth}')
 assert rect['left']>=0 and rect['right']<=rect['width']
 (ARTIFACTS/f'appearance-dark-zh-{width}.png').write_bytes(base64.b64decode(req('/screenshot')))
keys('\ue00c')
assert js('return document.querySelector(".settings-trigger").getAttribute("aria-expanded")')=='false'
req('/refresh',{});wait('document.querySelector(".settings-trigger") !== null')
assert js('return document.documentElement.dataset.theme')=='dark'
assert js('return document.querySelector(".settings-panel").hidden')
click('.settings-trigger');click('input[aria-label="中文模式"]');click('.setting-toggle input')
assert js('return document.documentElement.dataset.theme')=='light'
assert js('return document.documentElement.lang')=='en'
print('Settings defaults, dark/Chinese toggles, persistence, task fidelity and narrow layout passed.')
