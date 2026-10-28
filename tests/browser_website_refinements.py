"""Website refinement regression suite; serve the build or start Vite on :5174 and geckodriver on :4444.
Uses Python's standard library, an isolated profile, and disposable localStorage.
Run: python3 tests/browser_website_refinements.py
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

def node(id, done=False, children=None):
 return dict(id=id,title=id,done=done,children=children or [])
tree=[node('root',True,[node('before',True,[node('done',True)]),node('path',False,[node('first')]),node('after',True,[node('last',True)])]),node('other')]
load(tree)
click('button[aria-label="Node control root"]');time.sleep(.2)
assert js('return document.querySelectorAll(".expansion-marker").length')==1
folded=js('const e=document.querySelector(".expansion-marker"),r=e.getBoundingClientRect();return {w:r.width,h:r.height,color:getComputedStyle(e).backgroundColor}')
assert abs(folded['w']-18)<.1 and abs(folded['h']-2)<.1
click('button[aria-label="Node control root"]');time.sleep(.2)
assert js('return document.querySelector("[data-row-id=done]")') is None
assert js('return document.querySelector("[data-row-id=first]")') is not None
assert js('return document.querySelector("[data-row-id=last]")') is not None
expanded=js('const e=document.querySelector(".expansion-marker"),r=e.getBoundingClientRect();return {w:r.width,h:r.height}')
assert abs(expanded['w']-2)<.1 and abs(expanded['h']-18)<.1
assert stored()==tree
positions=js('return [...document.querySelectorAll(".row-shell")].map(e=>e.getBoundingClientRect().top)')
click('button[aria-label="Actions for root"]');time.sleep(.25)
assert positions==js('return [...document.querySelectorAll(".row-shell")].map(e=>e.getBoundingClientRect().top)')
assert js('return [...document.querySelector(".row-shell.revealed .action-panel").children].map(e=>e.textContent)')==['Delete cell','Delete subtree']
(ARTIFACTS/'website-refinements.png').write_bytes(base64.b64decode(req('/screenshot')))
button('Delete cell');assert [n['id'] for n in stored()]==['before','path','after','other']
button('Undo');assert stored()==tree
req('/window/rect',{'width':500,'height':844})
click('button[aria-label="Actions for root"]');time.sleep(.25)
button('Delete subtree');button('Delete with descendants');assert stored()==[tree[1]]
button('Undo');assert stored()==tree
print('Website tray, promotion/subtree deletion, undo, checked-parent indicators, expansion and narrow layout passed.')
