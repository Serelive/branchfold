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
 ident=js('return [...document.querySelectorAll("button")].find(b=>b.textContent===arguments[0] && b.getClientRects().length && (!b.closest("details") || b.closest("details").open))',label)
 assert ident,label
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
fixture=[{'id':'a','title':'Alpha','done':False,'children':[{'id':'c','title':'Child','done':True,'children':[]}]},{'id':'b','title':'Beta','done':False,'children':[]}]
backup=ARTIFACTS/'backup.json';backup.write_text(json.dumps({'version':1,'nodes':fixture}))
# Current implementation: create 32 siblings entirely from the keyboard.
load([])
button('+ Add root task')
for index in range(32):
 keys(*('Task '+str(index+1)))
 if index<31:keys('\ue007')
assert len(stored())==32
keys('\ue00c') # Escape to navigation
assert js('return document.activeElement.getAttribute("role")')=='treeitem'
keys(('\ue009','\ue013')) # Control+Up
assert stored()[30]['title']=='Task 32'
keys('\ue007') # Enter to edit
assert js('return document.activeElement.tagName')=='INPUT'
keys('\ue004') # indent
assert stored()[29]['children'][0]['title']=='Task 32'
keys(('\ue008','\ue004')) # Shift Tab outdent
assert stored()[30]['title']=='Task 32'
keys('\ue00c','b'); keys(*'Created with B')
assert stored()[31]['title']=='Created with B'
print('32-node keyboard entry, Enter/B mapping, Control+Up, Tab and Shift+Tab passed in Firefox.')
# Controls and titles have distinct keyboard behavior.
load(fixture);click('input[aria-label="Complete Beta"]');keys(('\ue009','\ue013'));assert stored()[0]['id']=='b'
print('Ctrl+Up works from checkbox focus in Firefox.')
# Checkbox no longer masquerades as a navigation selection; text edits never reorder.
load(fixture); click('input[data-node-id="b"]'); keys(('\ue009','\ue013'))
assert [n['id'] for n in stored()]==['a','b']
keys('\ue00c',('\ue009','\ue013'));assert stored()[0]['id']=='b'
print('Editing ignores structural Ctrl+Up; Escape then Ctrl+Up reorders.')
# Browser IME event guards (not a substitute for a desktop Fcitx5 session).
click('input[data-node-id="b"]')
js('const e=document.activeElement;e.dispatchEvent(new CompositionEvent("compositionstart",{bubbles:true}));for(const key of ["Enter","Tab","Escape"])e.dispatchEvent(new KeyboardEvent("keydown",{key,isComposing:true,bubbles:true}));e.dispatchEvent(new CompositionEvent("compositionend",{bubbles:true,data:"中文"}));e.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",keyCode:229,bubbles:true}));')
assert len(stored())==2
print('Browser composition-event guards passed (synthetic events only).')
# Correct import empty/nonempty confirmation, cancel, undo and reload.
load([]);text('input[type=file]',str(backup));wait('document.querySelector(".import-preview") !== null')
assert 'replaced' not in js('return document.querySelector(".import-preview").textContent')
button('Cancel import'); assert stored()==[]
text('input[type=file]',str(backup));wait('document.querySelector(".import-preview") !== null');button('Import tree');assert stored()==fixture
button('Undo');assert stored()==[];button('Redo');assert stored()==fixture
text('input[type=file]',str(backup));wait('document.querySelector(".import-preview") !== null');assert 'Current work will be replaced' in js('return document.querySelector(".import-preview").textContent');button('Cancel import')
req('/refresh',{});wait('document.querySelector("[data-row-id=a]") !== null');assert stored()==fixture
print('Empty/nonempty import, cancellation, undo/redo and reload passed.')
# Navigation context and deliberate parent deletion.
click('button[aria-label="Focus subtree Alpha"]')
click('summary[aria-label="Actions for Child"]');button('Outdent')
assert js('return document.querySelector("[data-node-id=b]")') is None
assert js('return document.querySelector("[data-node-id=c]")') is None
button('Undo');wait('document.querySelector("[data-node-id=c]") !== null')
click('[data-node-id=a]');keys('\ue00c','\ue017') # Delete
assert '1 descendants' in js("return document.querySelector('.warning[aria-label]').textContent")
button('Cancel deletion');keys('\ue017');button('Delete with descendants');assert stored()==[fixture[1]]
button('Undo');assert stored()==fixture
assert js('return document.querySelector("[data-node-id=b]")') is None
print('Context after moves/undo and parent deletion recovery passed.')
def drag(source,target,ratio=.5):
 js('document.querySelector(arguments[0]).scrollIntoView({block:"center"})',source)
 start=js('const r=document.querySelector(arguments[0]).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}',source)
 end=js('const r=document.querySelector(arguments[0]).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*arguments[1]}',target,ratio)
 moves=[{'type':'pointerMove','duration':100,'x':int(start['x']),'y':int(start['y'])},{'type':'pointerDown','button':0}]
 for i in range(1,9):moves.append({'type':'pointerMove','duration':100,'x':int(start['x']+(end['x']-start['x'])*i/8),'y':int(start['y']+(end['y']-start['y'])*i/8)})
 req('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':moves}]})
 state=js('return {drop:document.querySelector(".drag-status")?.textContent,classes:[...document.querySelectorAll(".branch")].map(e=>e.className)}')
 req('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerUp','button':0}]}]})
 return state
req('/window/rect',{'width':1280,'height':900})
for position,ratio in [('before',.1),('after',.9),('inside',.5)]:
 load(fixture)
 if position=='inside':click('button[aria-label="Collapse Alpha"]')
 state=drag('button[aria-label="Drag Alpha"]','[data-row-id=b]',ratio) if position=='after' else drag('button[aria-label="Drag Beta"]','[data-row-id=a]',ratio)
 print(position,state,stored())
 if position=='before':assert [n['id'] for n in stored()]==['b','a']
 elif position=='after':
  assert [n['id'] for n in stored()]==['b','a']
  assert stored()[1]['children']==fixture[0]['children']
 else:
  assert [n['id'] for n in stored()[0]['children']]==['c','b']
  assert js('return document.querySelector("[data-node-id=c]")') is None
  button('Go to moved node');assert js('return document.activeElement.dataset.rowId')=='b'
 button('Undo');assert stored()==fixture
load(fixture);before=stored();state=drag('button[aria-label="Drag Alpha"]','[data-row-id=c]',.5);assert stored()==before
print('Cycle rejection:',state)
# Focused-subtree drag after a child; moving a descendant to the view root boundary.
fixture[0]['children'].append({'id':'d','title':'Second child','done':False,'children':[]})
load(fixture);click('button[aria-label="Focus subtree Alpha"]')
state=drag('button[aria-label="Drag Child"]','[data-row-id=a]',.9)
assert [n['id'] for n in stored()]==['a','c','b']
assert js('return document.querySelector("[data-node-id=b]")') is None
button('Undo');assert stored()==fixture
print('Focused view drag and undo passed.')
load(fixture);click('button[aria-label="Focus subtree Child"]');assert 'Alpha' in js('return document.querySelector("nav").textContent');assert 'Child' in js('return document.querySelector("nav").textContent')
keys('\ue00c');assert js('return document.querySelector("button[aria-current]").textContent')=='Alpha'
print('Ancestor breadcrumbs and Escape passed.')
load(fixture)
(ARTIFACTS/'desktop.png').write_bytes(__import__('base64').b64decode(req('/screenshot')))
# Edge autoscroll while held, followed by Escape cancellation.
long_tree=[{'id':f'item-{i}','title':f'Task {i}','done':False,'children':[]} for i in range(60)]
load(long_tree);js('window.scrollTo(0,0)')
start=js('const r=document.querySelector(".drag-handle").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}')
height=js('return innerHeight')
req('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[
 {'type':'pointerMove','x':int(start['x']),'y':int(start['y'])},{'type':'pointerDown','button':0},
 {'type':'pointerMove','duration':300,'x':int(start['x']),'y':height-10},{'type':'pause','duration':500}]}]})
assert js('return scrollY')>0
keys('\ue00c')
req('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerUp','button':0}]}]})
assert stored()==long_tree
assert js('return document.querySelector(".drag-status")') is None
print('Drag edge autoscroll and Escape cancellation passed.')
# Preserve normal browser text undo without invoking structural undo.
load(fixture);click('[data-node-id=b]');keys(*' added');keys(('\ue009','z'))
assert stored()[1]['title']=='Beta'
print('Native text undo passed.')
req('/window/rect',{'width':390,'height':844});load(fixture)
(ARTIFACTS/'mobile.png').write_bytes(base64.b64decode(req('/screenshot')))
print('All Firefox regressions passed. Screenshots:',ARTIFACTS)
