# Coquille Iris — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la coquille actuelle de Lullaby (barre Windows + en-tête, rail indigo, onglets Conversations/Git) par la coquille Iris dense validée : barre de titre de 40 px, conversations groupées par projet, chat centré et panneau droit Git/Aperçu.

**Architecture:** `App.tsx` devient un assembleur. La logique pure (historique de navigation, regroupement de la barre latérale, largeur du panneau, raccourcis, stockage local) vit dans `src/renderer/src/shell/` et se teste sans rendu. Les composants `TitleBar`, `Sidebar` et `RightPanel` affichent cet état. Le chat, Git, l'Atelier et les paramètres existants sont branchés sans changer leur logique ; l'aperçu HTML passe dans le panneau droit par un portail React. Les styles de la coquille vivent dans `shell.css`, chargé après `iris.css` et `studio.css`.

**Tech Stack:** Electron 44 (`titleBarStyle: 'hidden'` + `titleBarOverlay`), React 19, assistant-ui, Vitest 5 + Testing Library (jsdom), TypeScript 7.

**Références :** [spec](../specs/2026-09-28-iris-shell-design.md), [maquette](../../mockups/iris-shell.html), [direction artistique](../../direction-artistique.md).

**Conventions du dépôt :** travailler dans `C:\Sources\lullaby-worktrees\iris-shell` (branche `feature/iris-shell`). Commandes : `npm test`, `npm run typecheck`, `npx vitest run tests/<fichier>`. Commits en anglais, préfixe conventionnel, terminés par la ligne `Co-Authored-By` demandée par la session. Ne jamais fusionner ni pousser sans autorisation.

---

## Structure des fichiers

| Fichier | Rôle |
| --- | --- |
| `src/main/window.ts` (modifié) | `windowOptions()` pur et testable : barre de titre masquée, `titleBarOverlay` |
| `src/renderer/src/shell/storage.ts` | Lecture/écriture `localStorage` tolérante + `usePersistentState` |
| `src/renderer/src/shell/navigation.ts` | Vues (`atelier`/`project`/`session`), historique précédent/suivant, purge |
| `src/renderer/src/shell/sidebarModel.ts` | Groupes de la barre latérale : tri, recherche, repli, limite de 5, libellés d'état |
| `src/renderer/src/shell/panel.ts` | Onglets du panneau droit et bornes de largeur |
| `src/renderer/src/shell/shortcuts.ts` | Table des raccourcis clavier + `useShortcuts` |
| `src/renderer/src/shell/ShellContext.ts` | Contexte : ouvrir le panneau, emplacement du portail d'aperçu |
| `src/renderer/src/shell/ShellIcon.tsx` | Icônes utilitaires 16 px de la coquille |
| `src/renderer/src/shell/StateMark.tsx` | Marque d'état d'une conversation (point, triangle, octogone) |
| `src/renderer/src/shell/TitleBar.tsx` | Barre de titre, sélecteur de projet, bascules du panneau |
| `src/renderer/src/shell/Sidebar.tsx` | Recherche, raccourcis, groupes de conversations, Paramètres |
| `src/renderer/src/shell/RightPanel.tsx` | Onglets Git/Aperçu, redimensionnement |
| `src/renderer/src/shell/AtelierView.tsx` | Atelier (vue d'ensemble) ou accueil sans projet |
| `src/renderer/src/styles/shell.css` | Jetons de densité et styles de la coquille et du contenu |
| `src/renderer/src/app/ProjectSessions.tsx` (réécrit) | `NewConversation` (choix du moteur, reprise CLI) et `SessionView` (en-tête + chat) |
| `src/renderer/src/app/App.tsx` (réécrit) | Assemblage et état de l'application |
| `src/renderer/src/chat/SessionChat.tsx` (modifié) | Aperçu rendu dans le panneau droit via portail |
| `src/renderer/src/app/ProjectWorkspace.tsx` (supprimé) | Remplacé par `RightPanel` |

Tests créés : `tests/window-options.test.ts`, `tests/shell-storage.test.ts`, `tests/shell-navigation-model.test.ts`, `tests/sidebar-model.test.ts`, `tests/shell-shortcuts.test.ts`, `tests/right-panel.test.tsx`, `tests/title-bar.test.tsx`, `tests/sidebar.test.tsx`, `tests/shell-app.test.tsx`. Modifiés : `tests/git-view.test.tsx`, `tests/studio-chat.test.tsx`. Supprimé : `tests/project-navigation.test.tsx` (remplacé par `tests/shell-app.test.tsx`).

---

### Task 0 : Aligner la spec sur le code existant

Trois points de la spec ne correspondent pas aux données disponibles : le moteur se choisit à la création (API `createSession(projectId, provider)`), les sessions n'ont pas d'horodatage (ordre = ordre de création dans le snapshot), et `Project` n'expose pas de dossier introuvable.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-28-iris-shell-design.md`

- [ ] **Step 1 : Corriger le paragraphe « Barre latérale »**

Remplacer :

```
**Barre latérale.** Groupes dans l'ordre stable des projets ; conversations de la
plus récente à la plus ancienne, cinq visibles puis « Afficher tout (n) ».
```

par :

```
**Barre latérale.** Groupes dans l'ordre stable des projets ; conversations de la
plus récemment créée à la plus ancienne (le snapshot n'a pas d'horodatage : pas
de date relative affichée), cinq visibles puis « Afficher tout (n) ». La
conversation active reste visible même au-delà des cinq.
```

Puis remplacer :

```
Échap la vide. Le + d'un groupe crée une conversation dans ce projet ; « Nouvelle »
utilise le projet actif ou propose d'en choisir un.
```

par :

```
Échap la vide. Le + d'un groupe ouvre « Nouvelle conversation » dans ce projet :
choix de Claude ou Codex (le moteur est fixé à la création) et reprise d'une
session CLI. « Nouvelle conversation » en haut utilise le projet actif, sinon ouvre
le sélecteur de projet de la barre de titre.
```

- [ ] **Step 2 : Retirer le cas « dossier introuvable »**

Dans le paragraphe **Erreurs**, supprimer la phrase :

```
Un projet dont le dossier est
introuvable garde son groupe, grisé, avec l'action de retrait.
```

et terminer le paragraphe après « avec son + ».

- [ ] **Step 3 : Commit**

```bash
git add docs/superpowers/specs/2026-09-28-iris-shell-design.md
git commit -m "docs: align Iris shell spec with session data"
```

---

### Task 1 : Fenêtre sans barre de titre native

**Files:**
- Modify: `src/main/window.ts`
- Test: `tests/window-options.test.ts`

- [ ] **Step 1 : Écrire le test**

```ts
import { expect,test,vi } from 'vitest';
vi.mock('electron',()=>({app:{},BrowserWindow:class{},shell:{}}));
import { TITLEBAR_HEIGHT,windowOptions } from '../src/main/window';
test('the window hides the native title bar and keeps native Windows controls',()=>{
  const options=windowOptions('C:/app','C:/app/preload.js');
  expect(TITLEBAR_HEIGHT).toBe(40);
  expect(options.titleBarStyle).toBe('hidden');
  expect(options.titleBarOverlay).toEqual({color:'#e9e5f5',symbolColor:'#302e50',height:40});
  expect(options.backgroundColor).toBe('#e9e5f5');
  expect(options.webPreferences).toMatchObject({preload:'C:/app/preload.js',contextIsolation:true,nodeIntegration:false,sandbox:true});
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/window-options.test.ts`
Expected: FAIL — `windowOptions` n'est pas exporté.

- [ ] **Step 3 : Implémenter**

Remplacer le contenu de `src/main/window.ts` par :

```ts
import { app, BrowserWindow, shell, type BrowserWindowConstructorOptions } from 'electron';
import { join } from 'node:path';
export const TITLEBAR_HEIGHT = 40;
// Native Windows caption buttons stay, painted in the Iris chrome colour.
export function windowOptions(appPath: string, preload: string): BrowserWindowConstructorOptions {
  return {
    width:1320,height:900,minWidth:720,minHeight:560,title:'Lullaby',backgroundColor:'#e9e5f5',show:false,
    icon:join(appPath,'resources/lullaby.ico'),
    autoHideMenuBar:true,
    titleBarStyle:'hidden',
    titleBarOverlay:{color:'#e9e5f5',symbolColor:'#302e50',height:TITLEBAR_HEIGHT},
    webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true},
  };
}
export function createWindow(): BrowserWindow {
  const window = new BrowserWindow(windowOptions(app.getAppPath(), join(__dirname,'../preload/index.js')));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(({url}) => {
    try { const parsed = new URL(url); if (['https:','http:'].includes(parsed.protocol)) void shell.openExternal(parsed.toString()); } catch { /* Invalid URL stays closed. */ }
    return {action:'deny'};
  });
  window.once('ready-to-show', () => window.show());
  return window;
}
```

- [ ] **Step 4 : Vérifier**

Run: `npx vitest run tests/window-options.test.ts` puis `npm run typecheck`
Expected: PASS, aucune erreur de types.

- [ ] **Step 5 : Commit**

```bash
git add src/main/window.ts tests/window-options.test.ts
git commit -m "feat: hide native title bar behind an Iris overlay"
```

---

### Task 2 : Stockage local tolérant

**Files:**
- Create: `src/renderer/src/shell/storage.ts`
- Test: `tests/shell-storage.test.ts`

- [ ] **Step 1 : Écrire le test**

```ts
// @vitest-environment jsdom
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import { act,renderHook } from '@testing-library/react';
import { isBoolean,isFlags,isNumber,readStored,usePersistentState,writeStored } from '../src/renderer/src/shell/storage';
beforeEach(()=>localStorage.clear());
afterEach(()=>vi.restoreAllMocks());
test('reads valid JSON values and falls back on missing, invalid or unreadable data',()=>{
  expect(readStored('k',false,isBoolean)).toBe(false);
  localStorage.setItem('k','true');expect(readStored('k',false,isBoolean)).toBe(true);
  localStorage.setItem('k','compact');expect(readStored('k',false,isBoolean)).toBe(false);
  localStorage.setItem('k','"texte"');expect(readStored('k',false,isBoolean)).toBe(false);
  localStorage.setItem('n','512');expect(readStored('n',420,isNumber)).toBe(512);
  localStorage.setItem('f','{"a":true,"b":"x"}');expect(readStored('f',{},isFlags)).toEqual({});
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked');});
  expect(readStored('k',false,isBoolean)).toBe(false);
});
test('writes never throw',()=>{
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
  expect(()=>writeStored('k',true)).not.toThrow();
});
test('usePersistentState remembers values and accepts updater functions',()=>{
  const {result}=renderHook(()=>usePersistentState('flags',{} as Record<string,boolean>,isFlags));
  act(()=>result.current[1](previous=>({...previous,a:true})));
  expect(result.current[0]).toEqual({a:true});
  expect(localStorage.getItem('flags')).toBe('{"a":true}');
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/shell-storage.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
import { useCallback, useState } from 'react';
// Browser storage can be blocked or cleared: every access falls back silently.
export function readStored<T>(key:string,fallback:T,valid:(value:unknown)=>value is T):T{
  try{const raw=localStorage.getItem(key);if(raw===null)return fallback;const value:unknown=JSON.parse(raw);return valid(value)?value:fallback;}catch{return fallback;}
}
export function writeStored(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Preference stays in memory. */}}
export const isBoolean=(value:unknown):value is boolean=>typeof value==='boolean';
export const isNumber=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
export const isFlags=(value:unknown):value is Record<string,boolean>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(item=>typeof item==='boolean');
export function usePersistentState<T>(key:string,fallback:T,valid:(value:unknown)=>value is T){
  const [value,setValue]=useState(()=>readStored(key,fallback,valid));
  const update=useCallback((next:T|((previous:T)=>T))=>{
    setValue(previous=>{const resolved=typeof next==='function'?(next as (previous:T)=>T)(previous):next;writeStored(key,resolved);return resolved;});
  },[key]);
  return [value,update] as const;
}
```

- [ ] **Step 4 : Vérifier**

Run: `npx vitest run tests/shell-storage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/renderer/src/shell/storage.ts tests/shell-storage.test.ts
git commit -m "feat: add tolerant local preference storage"
```

---

### Task 3 : Modèle de navigation

**Files:**
- Create: `src/renderer/src/shell/navigation.ts`
- Test: `tests/shell-navigation-model.test.ts`

- [ ] **Step 1 : Écrire le test**

```ts
import { expect,test } from 'vitest';
import { back,canBack,canForward,currentView,forward,initialNavigation,navigate,prune,type View } from '../src/renderer/src/shell/navigation';
const a:View={kind:'session',projectId:'p',sessionId:'a'};
const b:View={kind:'session',projectId:'p',sessionId:'b'};
const project:View={kind:'project',projectId:'q'};
test('starts on the Atelier and records visited views',()=>{
  expect(currentView(initialNavigation)).toEqual({kind:'atelier'});
  let nav=navigate(navigate(initialNavigation,a),b);
  expect(currentView(nav)).toEqual(b);expect(canBack(nav)).toBe(true);expect(canForward(nav)).toBe(false);
  nav=back(nav);expect(currentView(nav)).toEqual(a);expect(canForward(nav)).toBe(true);
  nav=forward(nav);expect(currentView(nav)).toEqual(b);
  expect(forward(nav)).toBe(nav);expect(back(initialNavigation)).toBe(initialNavigation);
});
test('navigating from the middle drops forward history and ignores repeats',()=>{
  let nav=back(navigate(navigate(initialNavigation,a),b));
  expect(navigate(nav,a)).toBe(nav);
  nav=navigate(nav,project);
  expect(nav.entries).toEqual([{kind:'atelier'},a,project]);expect(canForward(nav)).toBe(false);
});
test('history keeps the last fifty views',()=>{
  let nav=initialNavigation;
  for(let i=0;i<60;i++)nav=navigate(nav,{kind:'session',projectId:'p',sessionId:String(i)});
  expect(nav.entries).toHaveLength(50);expect(currentView(nav)).toEqual({kind:'session',projectId:'p',sessionId:'59'});
});
test('prune removes deleted views, merges neighbours and keeps a valid position',()=>{
  const nav=navigate(navigate(navigate(navigate(initialNavigation,a),b),a),project);
  const pruned=prune(nav,view=>!(view.kind==='session'&&view.sessionId==='b'));
  expect(pruned.entries).toEqual([{kind:'atelier'},a,project]);expect(currentView(pruned)).toEqual(project);
  const gone=prune(back(nav),view=>view.kind!=='session');
  expect(gone.entries).toEqual([{kind:'atelier'},project]);expect(currentView(gone)).toEqual({kind:'atelier'});
  expect(prune(nav,()=>true)).toBe(nav);
  expect(prune(nav,()=>false)).toEqual(initialNavigation);
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/shell-navigation-model.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
export type View={kind:'atelier'}|{kind:'project';projectId:string}|{kind:'session';projectId:string;sessionId:string};
export type Navigation={entries:View[];index:number};
const limit=50;
export const initialNavigation:Navigation={entries:[{kind:'atelier'}],index:0};
export const currentView=(nav:Navigation)=>nav.entries[nav.index];
export const canBack=(nav:Navigation)=>nav.index>0;
export const canForward=(nav:Navigation)=>nav.index<nav.entries.length-1;
export function sameView(a:View,b:View){
  if(a.kind==='atelier'||b.kind==='atelier')return a.kind===b.kind;
  if(a.kind==='project'||b.kind==='project')return a.kind===b.kind&&a.projectId===b.projectId;
  return a.sessionId===b.sessionId;
}
export function navigate(nav:Navigation,view:View):Navigation{
  if(sameView(currentView(nav),view))return nav;
  const entries=[...nav.entries.slice(0,nav.index+1),view].slice(-limit);
  return {entries,index:entries.length-1};
}
export const back=(nav:Navigation):Navigation=>canBack(nav)?{...nav,index:nav.index-1}:nav;
export const forward=(nav:Navigation):Navigation=>canForward(nav)?{...nav,index:nav.index+1}:nav;
// Drops views whose project or conversation disappeared, without leaving duplicates side by side.
export function prune(nav:Navigation,exists:(view:View)=>boolean):Navigation{
  const entries:View[]=[];let index=0;
  nav.entries.forEach((view,position)=>{
    if(!exists(view))return;
    if(!entries.length||!sameView(entries[entries.length-1],view))entries.push(view);
    if(position<=nav.index)index=entries.length-1;
  });
  if(!entries.length)return initialNavigation;
  if(entries.length===nav.entries.length)return nav;
  return {entries,index};
}
```

- [ ] **Step 4 : Vérifier**

Run: `npx vitest run tests/shell-navigation-model.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/renderer/src/shell/navigation.ts tests/shell-navigation-model.test.ts
git commit -m "feat: model shell navigation history"
```

---

### Task 4 : Modèle de la barre latérale

**Files:**
- Create: `src/renderer/src/shell/sidebarModel.ts`
- Test: `tests/sidebar-model.test.ts`

- [ ] **Step 1 : Écrire le test**

```ts
import { expect,test } from 'vitest';
import type { Phase,Project,Session } from '../src/shared/contracts';
import { needsAttention,phaseLabels,sidebarGroups } from '../src/renderer/src/shell/sidebarModel';
const projects:Project[]=[{id:'a',name:'Lullaby',cwd:'C:/a',folderKey:'a'},{id:'b',name:'Alice',cwd:'C:/b',folderKey:'b'},{id:'c',name:'Vide',cwd:'C:/c',folderKey:'c'}];
const session=(id:string,projectId:string,title:string,phase:Phase='idle'):Session=>({id,projectId,provider:'claude',title,phase,draft:'',choices:{}});
const sessions=[...Array.from({length:7},(_,i)=>session(`a${i}`,'a',`Tâche ${i}`)),session('b0','b','Courses','waiting')];
test('groups follow project order and list newest conversations first, five at a time',()=>{
  const groups=sidebarGroups(projects,sessions);
  expect(groups.map(g=>g.project.id)).toEqual(['a','b','c']);
  expect(groups[0].sessions.map(s=>s.id)).toEqual(['a6','a5','a4','a3','a2']);
  expect(groups[0].hidden).toBe(2);
  expect(groups[2].sessions).toEqual([]);expect(groups[2].hidden).toBe(0);
  expect(sidebarGroups(projects,sessions,{expanded:{a:true}})[0].hidden).toBe(0);
});
test('the active conversation stays visible beyond the limit',()=>{
  const group=sidebarGroups(projects,sessions,{active:'a0'})[0];
  expect(group.sessions.map(s=>s.id)).toEqual(['a6','a5','a4','a3','a2','a0']);expect(group.hidden).toBe(1);
});
test('collapsed groups hide rows but keep the attention signal',()=>{
  const group=sidebarGroups(projects,sessions,{collapsed:{b:true}})[1];
  expect(group.collapsed).toBe(true);expect(group.sessions).toEqual([]);expect(group.attention).toBe(true);
});
test('search matches project names or titles, ignores case and expands everything',()=>{
  expect(sidebarGroups(projects,sessions,{query:'  COURSES ',collapsed:{b:true}}).map(g=>[g.project.id,g.collapsed,g.sessions.map(s=>s.id)])).toEqual([['b',false,['b0']]]);
  expect(sidebarGroups(projects,sessions,{query:'lulla'})[0].sessions).toHaveLength(7);
  expect(sidebarGroups(projects,sessions,{query:'introuvable'})).toEqual([]);
});
test('attention and labels cover every phase',()=>{
  expect(['waiting','error','interrupted'].every(phase=>needsAttention(session('x','a','x',phase as Phase)))).toBe(true);
  expect(needsAttention(session('x','a','x','running'))).toBe(false);
  expect(Object.keys(phaseLabels).sort()).toEqual(['done','error','idle','interrupted','running','waiting']);
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/sidebar-model.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
import type { Phase, Project, Session } from '../../../shared/contracts';
export const phaseLabels:Record<Phase,string>={idle:'Prête',running:'En cours',waiting:'Attend votre réponse',done:'Terminée',interrupted:'Interrompue',error:'Erreur'};
export const needsAttention=(session:Session)=>session.phase==='waiting'||session.phase==='error'||session.phase==='interrupted';
export type SidebarGroup={project:Project;sessions:Session[];hidden:number;collapsed:boolean;attention:boolean};
export type SidebarOptions={query?:string;collapsed?:Record<string,boolean>;expanded?:Record<string,boolean>;active?:string;limit?:number};
const fold=(text:string)=>text.toLocaleLowerCase('fr');
// Sessions have no timestamp: the snapshot keeps creation order, so newest is last.
export function sidebarGroups(projects:Project[],sessions:Session[],{query='',collapsed={},expanded={},active,limit=5}:SidebarOptions={}):SidebarGroup[]{
  const search=fold(query.trim());
  return projects.flatMap(project=>{
    const own=sessions.filter(session=>session.projectId===project.id).reverse();
    const projectMatch=!search||fold(project.name).includes(search);
    const matching=projectMatch?own:own.filter(session=>fold(session.title).includes(search));
    if(search&&!matching.length&&!projectMatch)return [];
    const attention=own.some(needsAttention);
    if(!search&&collapsed[project.id])return [{project,sessions:[],hidden:0,collapsed:true,attention}];
    const max=search||expanded[project.id]?matching.length:limit;
    const visible=matching.slice(0,max);
    const current=matching.slice(max).find(session=>session.id===active);
    if(current)visible.push(current);
    return [{project,sessions:visible,hidden:matching.length-visible.length,collapsed:false,attention}];
  });
}
```

- [ ] **Step 4 : Vérifier**

Run: `npx vitest run tests/sidebar-model.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/renderer/src/shell/sidebarModel.ts tests/sidebar-model.test.ts
git commit -m "feat: group conversations by project for the sidebar"
```

---

### Task 5 : Raccourcis clavier et bornes du panneau

**Files:**
- Create: `src/renderer/src/shell/shortcuts.ts`
- Create: `src/renderer/src/shell/panel.ts`
- Test: `tests/shell-shortcuts.test.ts`

- [ ] **Step 1 : Écrire le test**

```ts
// @vitest-environment jsdom
import { expect,test,vi } from 'vitest';
import { fireEvent,renderHook } from '@testing-library/react';
import { shortcutFor,useShortcuts } from '../src/renderer/src/shell/shortcuts';
import { clampPanelWidth } from '../src/renderer/src/shell/panel';
const key=(key:string,mods:Partial<Record<'ctrlKey'|'altKey'|'shiftKey'|'metaKey',boolean>>={})=>({key,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,...mods});
test('maps the documented shortcuts only',()=>{
  expect(shortcutFor(key('b',{ctrlKey:true}))).toBe('toggleSidebar');
  expect(shortcutFor(key('J',{ctrlKey:true}))).toBe('togglePanel');
  expect(shortcutFor(key('k',{ctrlKey:true}))).toBe('search');
  expect(shortcutFor(key('n',{ctrlKey:true}))).toBe('newSession');
  expect(shortcutFor(key('ArrowLeft',{altKey:true}))).toBe('back');
  expect(shortcutFor(key('ArrowRight',{altKey:true}))).toBe('forward');
  expect(shortcutFor(key('b'))).toBeUndefined();
  expect(shortcutFor(key('b',{ctrlKey:true,shiftKey:true}))).toBeUndefined();
  expect(shortcutFor(key('ArrowLeft',{altKey:true,ctrlKey:true}))).toBeUndefined();
});
test('useShortcuts calls the latest handler and prevents the browser default',()=>{
  const first=vi.fn(),second=vi.fn();
  const handlers=(toggleSidebar:()=>void)=>({toggleSidebar,togglePanel:vi.fn(),search:vi.fn(),newSession:vi.fn(),back:vi.fn(),forward:vi.fn()});
  const {rerender,unmount}=renderHook(({h})=>useShortcuts(h),{initialProps:{h:handlers(first)}});
  rerender({h:handlers(second)});
  const event=new KeyboardEvent('keydown',{key:'b',ctrlKey:true,cancelable:true});
  window.dispatchEvent(event);
  expect(first).not.toHaveBeenCalled();expect(second).toHaveBeenCalledOnce();expect(event.defaultPrevented).toBe(true);
  unmount();fireEvent.keyDown(window,{key:'b',ctrlKey:true});expect(second).toHaveBeenCalledOnce();
});
test('panel width stays between 320 px and 60 % of the window',()=>{
  expect(clampPanelWidth(200,1400)).toBe(320);
  expect(clampPanelWidth(500.4,1400)).toBe(500);
  expect(clampPanelWidth(1000,1400)).toBe(840);
  expect(clampPanelWidth(600,400)).toBe(320);
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/shell-shortcuts.test.ts`
Expected: FAIL — modules introuvables.

- [ ] **Step 3 : Implémenter `shortcuts.ts`**

```ts
import { useEffect, useRef } from 'react';
export type ShortcutHandlers={toggleSidebar:()=>void;togglePanel:()=>void;search:()=>void;newSession:()=>void;back:()=>void;forward:()=>void};
type Keys={key:string;ctrlKey:boolean;altKey:boolean;shiftKey:boolean;metaKey:boolean};
export function shortcutFor(event:Keys):keyof ShortcutHandlers|undefined{
  if(event.metaKey||event.shiftKey)return undefined;
  if(event.ctrlKey&&!event.altKey){
    const byKey:Record<string,keyof ShortcutHandlers>={b:'toggleSidebar',j:'togglePanel',k:'search',n:'newSession'};
    return byKey[event.key.toLowerCase()];
  }
  if(event.altKey&&!event.ctrlKey){if(event.key==='ArrowLeft')return 'back';if(event.key==='ArrowRight')return 'forward';}
  return undefined;
}
export function useShortcuts(handlers:ShortcutHandlers){
  const latest=useRef(handlers);latest.current=handlers;
  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{const name=shortcutFor(event);if(!name)return;event.preventDefault();latest.current[name]();};
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[]);
}
```

- [ ] **Step 4 : Implémenter `panel.ts`**

```ts
export type PanelTab='git'|'preview';
export const panelTabs:[PanelTab,string][]=[['git','Git'],['preview','Aperçu']];
export const minPanelWidth=320;
export const defaultPanelWidth=420;
export function clampPanelWidth(width:number,viewport:number){
  return Math.round(Math.min(Math.max(minPanelWidth,viewport*.6),Math.max(minPanelWidth,width)));
}
```

- [ ] **Step 5 : Vérifier**

Run: `npx vitest run tests/shell-shortcuts.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6 : Commit**

```bash
git add src/renderer/src/shell/shortcuts.ts src/renderer/src/shell/panel.ts tests/shell-shortcuts.test.ts
git commit -m "feat: add shell shortcuts and panel width bounds"
```

---

### Task 6 : Jetons de densité et styles de la coquille

Pas de test automatisé : ces styles sont vérifiés visuellement en Task 13. Les classes sont celles utilisées par les composants des tâches 7 à 11.

**Files:**
- Create: `src/renderer/src/styles/shell.css`
- Modify: `src/renderer/src/main.tsx`

- [ ] **Step 1 : Créer `shell.css`**

```css
/* Iris shell: density tokens and window structure (docs/superpowers/specs/2026-09-28-iris-shell-design.md). */
:root{--chrome:#e9e5f5;--paper:#f6f4fb;--faint:#8f8aa8;--hover:#6551ad14;--rose-ink:#8a3340;
  --text-xs:11px;--text-sm:13px;--text-md:14px;--text-lg:16px;--row:32px;--control:28px;--icon:16px;--radius:6px;--radius-lg:8px;
  --space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:24px;--titlebar:40px;--sidebar:280px;--fast:120ms;--medium:160ms;--chat-font:14px}
@media (prefers-reduced-motion:reduce){:root{--fast:0ms;--medium:0ms}}
[data-motion=off]{--fast:0ms;--medium:0ms}
html,body,#root{height:100%;margin:0;background:var(--chrome)}
.shell.iris-shell{position:relative;display:grid;grid-template-rows:var(--titlebar) minmax(0,1fr);grid-template-columns:none;height:100dvh;overflow:hidden;background:var(--chrome);font:var(--text-sm)/1.3 'Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink)}
.iris-shell .shell-body{display:grid;grid-template-columns:var(--sidebar) minmax(0,1fr) auto;min-height:0;transition:grid-template-columns var(--medium) ease}
.iris-shell.sidebar-hidden .shell-body{grid-template-columns:0 minmax(0,1fr) auto}
:where(.iris-shell) button{font:inherit;color:inherit}
.iris-shell :focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.shell-glyph{width:var(--icon);height:var(--icon);flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.shell-icon{display:grid;place-items:center;width:var(--control);height:var(--control);padding:0;margin:0;border:0;border-radius:var(--radius);background:none;color:var(--muted);cursor:pointer;transition:background var(--fast),color var(--fast)}
.shell-icon:hover{background:var(--hover);color:var(--ink)}
.shell-icon[aria-pressed=true]{background:var(--accent-soft);color:var(--accent)}
.shell-icon:disabled{opacity:.35;cursor:default;background:none}
.shell-icon.small{width:22px;height:22px}
.shell-icon.small .shell-glyph{width:14px;height:14px}
.shell-button{display:inline-flex;align-items:center;gap:6px;height:var(--control);padding:0 12px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);font-weight:600;cursor:pointer;transition:background var(--fast),border-color var(--fast)}
.shell-button:hover{border-color:#c9c3de}
.shell-button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.shell-button.primary:hover{background:#584599}

/* Title bar */
.titlebar{display:flex;align-items:center;gap:2px;min-width:0;height:var(--titlebar);padding:0 calc(100vw - env(titlebar-area-x,0px) - env(titlebar-area-width,100vw)) 0 8px;background:var(--chrome);user-select:none;-webkit-app-region:drag}
.titlebar button,.titlebar .shell-menu{-webkit-app-region:no-drag}
.titlebar-logo{width:20px;height:22px;margin:0 8px 0 4px}
.project-switcher{position:relative;margin-left:8px}
.project-switch{display:flex;align-items:center;gap:6px;height:var(--control);padding:0 8px;border:0;border-radius:var(--radius);background:none;font-weight:600;cursor:pointer;transition:background var(--fast)}
.project-switch:hover{background:var(--hover)}
.project-switch .project-emblem,.shell-menu .project-emblem{width:16px;height:18px;filter:none}
.project-switch .shell-glyph:last-child{width:12px;height:12px;color:var(--faint)}
.titlebar-path{min-width:0;margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font:var(--text-xs) 'Cascadia Code',Consolas,monospace}
.titlebar-drag{flex:1;align-self:stretch;min-width:24px}
.titlebar-tools{display:flex;gap:2px;margin-right:8px}
.shell-menu{position:absolute;top:calc(100% + 4px);left:0;z-index:40;min-width:260px;padding:4px;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);box-shadow:0 8px 24px #30285014;animation:shell-menu-in var(--fast) ease}
.shell-menu button{display:flex;align-items:center;gap:8px;width:100%;height:var(--row);padding:0 8px;border:0;border-radius:var(--radius);background:none;text-align:left;cursor:pointer}
.shell-menu button:hover,.shell-menu button:focus-visible{background:var(--hover)}
.shell-menu small{margin-left:auto;color:var(--faint);font-size:var(--text-xs)}
@keyframes shell-menu-in{from{opacity:0;transform:translateY(-4px)}}

/* Sidebar */
.sidebar{display:flex;flex-direction:column;min-width:0;overflow:hidden;padding:4px 8px 8px;background:var(--chrome)}
.iris-shell.sidebar-hidden .sidebar{visibility:hidden}
.sidebar-search{display:flex;align-items:center;gap:8px;height:var(--row);padding:0 8px;margin-bottom:6px;border:1px solid var(--line);border-radius:var(--radius);background:#fcfbff99;color:var(--faint)}
.sidebar-search:focus-within{border-color:var(--accent);background:var(--surface)}
.sidebar-search input{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;color:var(--ink)}
.sidebar-search kbd{padding:1px 4px;border:1px solid var(--line);border-radius:4px;font:10px 'Segoe UI',sans-serif;color:var(--faint)}
.sidebar-row{display:flex;align-items:center;gap:8px;width:100%;height:var(--row);padding:0 8px;border:0;border-radius:var(--radius);background:none;text-align:left;cursor:pointer;transition:background var(--fast)}
.sidebar-row:hover{background:var(--hover)}
.sidebar-row.active{background:var(--accent-soft);font-weight:600}
.sidebar-row .shell-glyph{color:var(--muted)}
.sidebar-scroll{flex:1;overflow:auto;margin:6px -8px 0;padding:0 8px;scrollbar-width:thin;scrollbar-color:#c9c3de transparent}
.sidebar-section{display:flex;align-items:center;justify-content:space-between;height:28px;margin-top:10px;padding-left:8px;color:var(--faint);font-size:var(--text-xs);letter-spacing:.06em;text-transform:uppercase}
.sidebar-group-head{display:flex;align-items:center;gap:6px;height:28px;margin-top:6px;padding-right:4px;border-radius:var(--radius)}
.sidebar-group-head:hover{background:var(--hover)}
.sidebar-group-toggle{display:flex;align-items:center;gap:8px;flex:1;min-width:0;height:100%;padding:0 8px;border:0;background:none;color:var(--muted);font-weight:600;text-align:left;cursor:pointer}
.sidebar-group-toggle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sidebar-group-toggle .project-emblem{width:16px;height:18px;filter:none}
.sidebar-group-toggle .shell-glyph{width:12px;height:12px;color:var(--faint);transition:transform var(--fast)}
.sidebar-group.collapsed .sidebar-group-toggle .shell-glyph{transform:rotate(-90deg)}
.sidebar-group-actions{display:flex;align-items:center;opacity:0;transition:opacity var(--fast)}
.sidebar-group-head:hover .sidebar-group-actions,.sidebar-group-head:focus-within .sidebar-group-actions{opacity:1}
.attention-dot{margin-left:0;width:7px;height:7px;flex:none;border-radius:50%;background:#d49a3a}
.sidebar-sessions{margin:0;padding:0;list-style:none}
.sidebar-session{position:relative;display:flex;align-items:center;border-radius:var(--radius);transition:background var(--fast)}
.sidebar-session:hover{background:var(--hover)}
.sidebar-session.active{background:var(--accent-soft)}
.sidebar-session>button{display:flex;align-items:center;gap:8px;flex:1;min-width:0;height:var(--row);padding:0 8px 0 12px;border:0;background:none;text-align:left;cursor:pointer}
.sidebar-session.active>button{font-weight:600}
.sidebar-session>button>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sidebar-session .session-actions{opacity:0;transition:opacity var(--fast)}
.sidebar-session:hover .session-actions,.sidebar-session:focus-within .session-actions,.sidebar-session .session-actions:has([aria-expanded=true]){opacity:1}
.sidebar .session-menu-trigger,.sidebar .project-actions .icon-button{width:22px;height:22px;padding:3px;border:0;border-radius:var(--radius);background:none;box-shadow:none;transform:none}
.sidebar .session-menu-trigger:hover,.sidebar .project-actions .icon-button:hover{background:var(--hover);transform:none}
.sidebar-more{height:28px;padding:0 8px 0 32px;border:0;border-radius:var(--radius);background:none;color:var(--accent);font-size:var(--text-xs);cursor:pointer}
.sidebar-more:hover{background:var(--hover)}
.sidebar-empty{display:flex;align-items:center;height:28px;margin:0;padding:0 8px 0 32px;color:var(--faint);font-size:var(--text-xs)}
.sidebar-footer{margin-top:6px;padding-top:6px;border-top:1px solid var(--line)}
.state-mark{display:grid;place-items:center;width:12px;height:12px;flex:none}
.state-mark::before{content:'';width:5px;height:5px;border-radius:50%;background:#bdb6d4}
.state-mark.done::before{background:#7cc0aa}
.state-mark.running::before{width:7px;height:7px;background:#3d9a80;box-shadow:0 0 0 3px var(--mint);animation:state-breathe 2.4s ease-in-out infinite}
.state-mark.waiting::before,.state-mark.interrupted::before,.state-mark.error::before{display:none}
.state-mark svg{width:12px;height:12px}
.state-mark.waiting svg,.state-mark.interrupted svg{fill:#b77a1c}
.state-mark.error svg{fill:#b4404f}
.state-mark .glyph{fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round}
@keyframes state-breathe{50%{box-shadow:0 0 0 1px var(--mint)}}
@media (prefers-reduced-motion:reduce){.state-mark.running::before{animation:none}}

/* Main area */
.main-area{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;background:var(--paper);border-top-left-radius:var(--radius-lg)}
.iris-shell.sidebar-hidden .main-area{border-top-left-radius:0}
.shell-notice{display:flex;align-items:center;gap:8px;flex:none;min-height:32px;padding:4px 12px;background:var(--amber);color:var(--amber-ink)}
.shell-notice button{margin-left:auto;border:0;background:none;text-decoration:underline;cursor:pointer}
.main-header{display:flex;align-items:center;gap:8px;flex:none;height:40px;padding:0 16px;border-bottom:1px solid var(--line)}
.main-header h1{margin:0;font-size:var(--text-sm);font-weight:600;letter-spacing:0;line-height:1.3}

/* Right panel */
.right-panel{position:relative;display:flex;flex-direction:column;width:0;min-width:0;overflow:hidden;background:var(--surface);border-left:1px solid transparent;transition:width var(--medium) ease}
.right-panel.open{width:var(--panel-width,420px);border-left-color:var(--line)}
.right-panel.resizing{transition:none}
.panel-resizer{position:absolute;left:0;top:0;bottom:0;z-index:2;width:6px;cursor:col-resize}
.panel-resizer:hover,.panel-resizer:focus-visible,.right-panel.resizing .panel-resizer{background:#6551ad33}
.panel-tabs{display:flex;align-items:center;gap:2px;flex:none;height:40px;padding:0 8px;border-bottom:1px solid var(--line)}
.panel-tab{display:flex;align-items:center;gap:6px;height:var(--control);padding:0 10px;border:0;border-radius:var(--radius);background:none;color:var(--muted);font-weight:600;cursor:pointer;transition:background var(--fast)}
.panel-tab:hover{background:var(--hover)}
.panel-tab[aria-selected=true]{background:var(--accent-soft);color:var(--ink)}
.panel-tablist{display:flex;gap:2px}
.panel-tabs .shell-icon{margin-left:auto}
.iris-shell .shell-icon:active,.iris-shell .panel-tab:active{transform:none}
.panel-body{display:flex;flex-direction:column;flex:1;min-height:0;min-width:320px;overflow:auto}
.panel-body[hidden]{display:none}
.preview-slot{display:contents}
.panel-empty{margin:24px 16px;color:var(--faint);text-align:center}
.preview-slot:not(:empty)+.panel-empty{display:none}
.right-panel .preview-pane{flex:1;border-left:0;border-top:0}
@media (max-width:999px){.right-panel.open{position:absolute;right:0;top:var(--titlebar);bottom:0;z-index:20;box-shadow:-8px 0 24px #30285014}}
```

- [ ] **Step 2 : Charger `shell.css` en dernier**

Dans `src/renderer/src/main.tsx`, ajouter après `import './styles/studio.css';` :

```ts
import './styles/shell.css';
```

- [ ] **Step 3 : Vérifier**

Run: `npm run typecheck` puis `npm test`
Expected: aucune erreur, tous les tests existants passent (le CSS n'est pas chargé par les tests).

- [ ] **Step 4 : Commit**

```bash
git add src/renderer/src/styles/shell.css src/renderer/src/main.tsx
git commit -m "feat: add Iris shell density tokens and layout styles"
```

---

### Task 7 : Icônes, marque d'état et contexte de coquille

**Files:**
- Create: `src/renderer/src/shell/ShellIcon.tsx`
- Create: `src/renderer/src/shell/StateMark.tsx`
- Create: `src/renderer/src/shell/ShellContext.ts`
- Test: `tests/sidebar.test.tsx` (premier test, complété en Task 10)

- [ ] **Step 1 : Écrire le test**

```tsx
// @vitest-environment jsdom
import { afterEach,expect,test } from 'vitest';
import { cleanup,render,screen } from '@testing-library/react';
import { StateMark } from '../src/renderer/src/shell/StateMark';
afterEach(cleanup);
test('state marks are labelled and use a shape beyond colour for attention',()=>{
  const {container}=render(<><StateMark phase="waiting"/><StateMark phase="error"/><StateMark phase="running"/></>);
  expect(screen.getByRole('img',{name:'Attend votre réponse'}).querySelector('svg')).toBeTruthy();
  expect(screen.getByRole('img',{name:'Erreur'}).querySelector('svg')).toBeTruthy();
  expect(screen.getByRole('img',{name:'En cours'}).querySelector('svg')).toBeNull();
  expect(container.querySelectorAll('.state-mark')).toHaveLength(3);
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/sidebar.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Créer `ShellIcon.tsx`**

```tsx
const paths={
  rail:'M4 5h16v14H4z M9 5v14',
  back:'M19 12H5 M11 6l-6 6 6 6',
  forward:'M5 12h14 M13 6l6 6-6 6',
  chevron:'m6 9 6 6 6-6',
  search:'M16.5 16.5 20 20 M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  plus:'M12 5v14 M5 12h14',
  edit:'M4 20h4L19 9l-4-4L4 16z',
  atelier:'m12 3 8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9',
  settings:'M9 3h6l1 3 3 1.5 2 4.5-2 4.5-3 1.5-1 3H9l-1-3-3-1.5L3 12l2-4.5L8 6z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  git:'M6 8.2v7.6 M6 8.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z M6 20.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z M18 11.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z M18 11.2c0 4-6 3-10.5 5.6',
  preview:'M4 5h16v14H4z M4 9h16',
  close:'m6 6 12 12 M18 6 6 18',
};
export type ShellIconName=keyof typeof paths;
// Stroke icons sized by --icon; the faceted emblems stay reserved for projects.
export function ShellIcon({name}:{name:ShellIconName}){return <svg className="shell-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]}/></svg>;}
```

- [ ] **Step 4 : Créer `StateMark.tsx`**

```tsx
import type { Phase } from '../../../shared/contracts';
import { phaseLabels } from './sidebarModel';
export function StateMark({phase}:{phase:Phase}){
  const warning=phase==='waiting'||phase==='interrupted';
  return <span className={`state-mark ${phase}`} role="img" aria-label={phaseLabels[phase]}>
    {warning&&<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 20H2z"/><path className="glyph" d="M12 9v5m0 3h.01"/></svg>}
    {phase==='error'&&<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path className="glyph" d="m9 9 6 6m0-6-6 6"/></svg>}
  </span>;
}
```

- [ ] **Step 5 : Créer `ShellContext.ts`**

```ts
import { createContext } from 'react';
import type { PanelTab } from './panel';
export type Shell={openPanel:(tab:PanelTab)=>void;previewSlot:HTMLElement|null};
// Outside the shell (tests, isolated views) previews stay inline in the chat.
export const ShellContext=createContext<Shell>({openPanel:()=>{},previewSlot:null});
```

- [ ] **Step 6 : Vérifier**

Run: `npx vitest run tests/sidebar.test.tsx` puis `npm run typecheck`
Expected: PASS.

- [ ] **Step 7 : Commit**

```bash
git add src/renderer/src/shell/ShellIcon.tsx src/renderer/src/shell/StateMark.tsx src/renderer/src/shell/ShellContext.ts tests/sidebar.test.tsx
git commit -m "feat: add shell icons, state marks and shell context"
```

---

### Task 8 : Panneau droit et aperçu par portail

**Files:**
- Create: `src/renderer/src/shell/RightPanel.tsx`
- Modify: `src/renderer/src/chat/SessionChat.tsx` (fonction `acceptPreview` et rendu final)
- Test: `tests/right-panel.test.tsx`
- Modify: `tests/git-view.test.tsx` (test « returning from Git keeps the actual assistant-ui draft »)
- Modify: `tests/studio-chat.test.tsx` (nouveau test de portail)

- [ ] **Step 1 : Écrire le test du panneau**

```tsx
// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
vi.mock('../src/renderer/src/git/GitView',()=>({GitView:({projectId,active}:any)=><output aria-label="Git affiché">{`${projectId}:${active}`}</output>}));
import { RightPanel } from '../src/renderer/src/shell/RightPanel';
afterEach(cleanup);
const props={width:420,onTab:vi.fn(),onClose:vi.fn(),onResize:vi.fn(),onSlot:vi.fn()};
test('closed panel is inert and mounts Git only once opened',()=>{
  const view=render(<RightPanel {...props} projectId="p"/>);
  const panel=view.container.querySelector('.right-panel')!;
  expect(panel.hasAttribute('inert')).toBe(true);expect(panel.classList.contains('open')).toBe(false);
  expect(screen.queryByLabelText('Git affiché')).toBeNull();
  view.rerender(<RightPanel {...props} projectId="p" tab="git"/>);
  expect(panel.hasAttribute('inert')).toBe(false);expect(screen.getByLabelText('Git affiché').textContent).toBe('p:true');
  view.rerender(<RightPanel {...props} projectId="p" tab="preview"/>);
  expect(screen.getByLabelText('Git affiché').textContent).toBe('p:false');
  expect(screen.getByRole('tab',{name:'Aperçu'}).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText(/Aucun aperçu ouvert/)).toBeTruthy();
});
test('tabs, close and keyboard resizing report to the shell',()=>{
  render(<RightPanel {...props} tab="git"/>);
  expect(screen.getByText('Ouvrez un projet pour consulter Git.')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab',{name:'Aperçu'}));expect(props.onTab).toHaveBeenCalledWith('preview');
  fireEvent.click(screen.getByRole('button',{name:'Fermer le panneau'}));expect(props.onClose).toHaveBeenCalled();
  Object.defineProperty(window,'innerWidth',{configurable:true,value:1400});
  fireEvent.keyDown(screen.getByRole('separator',{name:'Redimensionner le panneau'}),{key:'ArrowLeft'});
  expect(props.onResize).toHaveBeenCalledWith(436);
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/right-panel.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Créer `RightPanel.tsx`**

```tsx
import { useEffect, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { GitView } from '../git/GitView';
import { ShellIcon } from './ShellIcon';
import { clampPanelWidth, minPanelWidth, panelTabs, type PanelTab } from './panel';
type Props={tab?:PanelTab;width:number;projectId?:string;onTab:(tab:PanelTab)=>void;onClose:()=>void;onResize:(width:number)=>void;onSlot:(element:HTMLDivElement|null)=>void};
export function RightPanel({tab,width,projectId,onTab,onClose,onResize,onSlot}:Props){
  const [gitOpened,setGitOpened]=useState(false);const [resizing,setResizing]=useState(false);
  useEffect(()=>{if(tab==='git')setGitOpened(true);},[tab]);
  function startResize(event:PointerEvent<HTMLDivElement>){
    event.preventDefault();setResizing(true);
    const move=(next:globalThis.PointerEvent)=>onResize(clampPanelWidth(window.innerWidth-next.clientX,window.innerWidth));
    const stop=()=>{setResizing(false);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);
  }
  function keyResize(event:KeyboardEvent<HTMLDivElement>){
    const step=event.key==='ArrowLeft'?16:event.key==='ArrowRight'?-16:0;if(!step)return;
    event.preventDefault();onResize(clampPanelWidth(width+step,window.innerWidth));
  }
  return <aside className={`right-panel ${tab?'open':''} ${resizing?'resizing':''}`} aria-label="Panneau latéral" inert={!tab} style={{'--panel-width':`${width}px`} as CSSProperties}>
    <div className="panel-resizer" role="separator" aria-orientation="vertical" aria-label="Redimensionner le panneau" aria-valuenow={width} aria-valuemin={minPanelWidth} tabIndex={0} onPointerDown={startResize} onKeyDown={keyResize}/>
    <div className="panel-tabs" role="tablist" aria-label="Contenu du panneau">
      {panelTabs.map(([id,label])=><button key={id} role="tab" className="panel-tab" aria-selected={tab===id} onClick={()=>onTab(id)}><ShellIcon name={id}/>{label}</button>)}
      <button className="shell-icon" aria-label="Fermer le panneau" title="Fermer (Ctrl+J)" onClick={onClose}><ShellIcon name="close"/></button>
    </div>
    <div className="panel-body" role="tabpanel" aria-label="Git" hidden={tab!=='git'}>
      {projectId?gitOpened&&<GitView key={projectId} projectId={projectId} active={tab==='git'}/>:<p className="panel-empty">Ouvrez un projet pour consulter Git.</p>}
    </div>
    <div className="panel-body" role="tabpanel" aria-label="Aperçu" hidden={tab!=='preview'}>
      <div className="preview-slot" ref={onSlot}/>
      <p className="panel-empty">Aucun aperçu ouvert. Utilisez « Aperçu » sur un bloc HTML ou le + de la zone de saisie.</p>
    </div>
  </aside>;
}
```

- [ ] **Step 4 : Vérifier le panneau**

Run: `npx vitest run tests/right-panel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5 : Écrire le test de portail dans `tests/studio-chat.test.tsx`**

Ajouter l'import en tête du fichier :

```tsx
import { ShellContext } from '../src/renderer/src/shell/ShellContext';
```

Ajouter à la fin du fichier :

```tsx
test('inside the shell, previews render in the right panel slot and open it',async()=>{
  api({previewHtml:vi.fn().mockResolvedValue({ok:true,value:{id:'preview',title:'HTML',url:'http://127.0.0.1:1234/token'}})});
  const slot=document.createElement('div');document.body.append(slot);const openPanel=vi.fn();
  try{
    const rendered=render(<ShellContext.Provider value={{openPanel,previewSlot:slot}}>{view({...state,messages:{studio:[{id:'html',role:'assistant',text:'```html\n<h1>Bonjour</h1>\n```',actions:[]}]}})}</ShellContext.Provider>);
    fireEvent.click(await screen.findByRole('button',{name:'Aperçu'}));
    await waitFor(()=>expect(slot.querySelector('iframe')).toBeTruthy());
    expect(openPanel).toHaveBeenCalledWith('preview');
    expect(rendered.container.querySelector('.chat-layout')!.classList.contains('has-preview')).toBe(false);
  }finally{slot.remove();}
});
```

- [ ] **Step 6 : Vérifier l'échec**

Run: `npx vitest run tests/studio-chat.test.tsx`
Expected: FAIL sur le nouveau test (l'iframe reste dans le chat, `openPanel` non appelé).

- [ ] **Step 7 : Modifier `SessionChat.tsx`**

Ajouter aux imports :

```tsx
import { createPortal } from 'react-dom';
import { ShellContext } from '../shell/ShellContext';
```

Dans le composant, juste avant la déclaration de `pending` (ligne `const pending=snapshot.pending.filter(...)`), ajouter :

```tsx
  const shell=useContext(ShellContext);
```

Dans `acceptPreview`, remplacer `setDocument(next);setReview(undefined);}` par :

```tsx
setDocument(next);setReview(undefined);shell.openPanel('preview');}
```

Dans le `return`, remplacer :

```tsx
<div className={`chat-layout ${document?'has-preview':review?'has-review':''}`}>
```

par :

```tsx
<div className={`chat-layout ${document&&!shell.previewSlot?'has-preview':review?'has-review':''}`}>
```

et remplacer :

```tsx
{document&&<PreviewPane document={document} onClose={closePreview} onError={setNotice}/>}
```

par :

```tsx
{document&&(shell.previewSlot?createPortal(<PreviewPane document={document} onClose={closePreview} onError={setNotice}/>,shell.previewSlot):<PreviewPane document={document} onClose={closePreview} onError={setNotice}/>)}
```

`useContext` est déjà importé depuis `react` dans ce fichier.

- [ ] **Step 8 : Adapter `tests/git-view.test.tsx`**

Remplacer l'import `import { ProjectWorkspace } from '../src/renderer/src/app/ProjectWorkspace';` par :

```tsx
import { RightPanel } from '../src/renderer/src/shell/RightPanel';
```

Remplacer le test `returning from Git keeps the actual assistant-ui draft` par :

```tsx
test('opening Git in the right panel keeps the actual assistant-ui draft',async()=>{
  api();Object.assign(window.lullaby,{saveDraft:vi.fn().mockResolvedValue({ok:true}),send:vi.fn(),interrupt:vi.fn()});
  const state={revision:1,projects:[],sessions:[{id:'chat-git',projectId:'p',provider:'claude' as const,title:'Chat',phase:'idle' as const,draft:'',choices:{}}],messages:{'chat-git':[]},pending:[]};
  const panel=(tab?:'git')=><SnapshotContext.Provider value={state}><SessionChat sessionId="chat-git"/><RightPanel tab={tab} width={420} projectId="p" onTab={()=>{}} onClose={()=>{}} onResize={()=>{}} onSlot={()=>{}}/></SnapshotContext.Provider>;
  const view=render(panel());
  fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'mon brouillon'}});
  view.rerender(panel('git'));await screen.findByRole('heading',{name:'Merge fixture'});
  expect((screen.getByRole('textbox',{name:'Votre message'})as HTMLTextAreaElement).value).toBe('mon brouillon');
});
```

- [ ] **Step 9 : Vérifier**

Run: `npx vitest run tests/right-panel.test.tsx tests/studio-chat.test.tsx tests/git-view.test.tsx` puis `npm run typecheck`
Expected: PASS ; le test existant « HTML code opens an isolated side preview » passe toujours (sans contexte, l'aperçu reste dans le chat).

- [ ] **Step 10 : Commit**

```bash
git add src/renderer/src/shell/RightPanel.tsx src/renderer/src/chat/SessionChat.tsx tests/right-panel.test.tsx tests/studio-chat.test.tsx tests/git-view.test.tsx
git commit -m "feat: show Git and HTML previews in a resizable right panel"
```

---

### Task 9 : Barre de titre

**Files:**
- Create: `src/renderer/src/shell/TitleBar.tsx`
- Test: `tests/title-bar.test.tsx`

- [ ] **Step 1 : Écrire le test**

```tsx
// @vitest-environment jsdom
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { TitleBar } from '../src/renderer/src/shell/TitleBar';
afterEach(cleanup);
const projects=[{id:'a',name:'Lullaby',cwd:'C:/Sources/lullaby',folderKey:'a'},{id:'b',name:'Alice',cwd:'C:/Sources/alice',folderKey:'b'}];
const sessions=[{id:'s',projectId:'a',provider:'claude' as const,title:'T',phase:'idle' as const,draft:'',choices:{}}];
function props(extra={}){return {projects,sessions,sidebarHidden:false,canBack:false,canForward:true,menuOpen:false,onMenu:vi.fn(),onToggleSidebar:vi.fn(),onBack:vi.fn(),onForward:vi.fn(),onSelectProject:vi.fn(),onAtelier:vi.fn(),onTogglePanel:vi.fn(),...extra};}
test('shows the current project, its path and navigation state',()=>{
  const p=props({project:projects[0],panel:'git'});render(<TitleBar {...p}/>);
  expect(screen.getByRole('button',{name:/Lullaby/,expanded:false})).toBeTruthy();
  expect(screen.getByText('C:/Sources/lullaby')).toBeTruthy();
  expect((screen.getByRole('button',{name:'Précédent'})as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Suivant'}));expect(p.onForward).toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Git'}).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Aperçu'}));expect(p.onTogglePanel).toHaveBeenCalledWith('preview');
  fireEvent.click(screen.getByRole('button',{name:'Masquer la barre latérale'}));expect(p.onToggleSidebar).toHaveBeenCalled();
});
test('the project menu lists the Atelier and projects, then closes',()=>{
  const p=props({menuOpen:true});render(<TitleBar {...p}/>);
  expect(screen.getByRole('button',{name:/Atelier/,expanded:true})).toBeTruthy();
  expect(screen.getByRole('menuitem',{name:/Alice/}).textContent).toContain('0 conv.');
  fireEvent.click(screen.getByRole('menuitem',{name:/Lullaby/}));
  expect(p.onMenu).toHaveBeenCalledWith(false);expect(p.onSelectProject).toHaveBeenCalledWith('a');
  fireEvent.keyDown(document,{key:'Escape'});expect(p.onMenu).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/title-bar.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter**

```tsx
import { useEffect, useRef } from 'react';
import type { Project, Session } from '../../../shared/contracts';
import logo from '../assets/lullaby.svg';
import { ProjectEmblem } from '../app/ProjectEmblem';
import { ShellIcon } from './ShellIcon';
import type { PanelTab } from './panel';
type Props={project?:Project;projects:Project[];sessions:Session[];sidebarHidden:boolean;canBack:boolean;canForward:boolean;panel?:PanelTab;menuOpen:boolean;
  onMenu:(open:boolean)=>void;onToggleSidebar:()=>void;onBack:()=>void;onForward:()=>void;onSelectProject:(id:string)=>void;onAtelier:()=>void;onTogglePanel:(tab:PanelTab)=>void};
export function TitleBar(p:Props){
  const anchor=useRef<HTMLDivElement>(null);const onMenu=useRef(p.onMenu);onMenu.current=p.onMenu;
  useEffect(()=>{
    if(!p.menuOpen)return;
    const outside=(event:PointerEvent)=>{if(!anchor.current?.contains(event.target as Node))onMenu.current(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')onMenu.current(false);};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[p.menuOpen]);
  const count=(id:string)=>p.sessions.filter(session=>session.projectId===id).length;
  const choose=(action:()=>void)=>()=>{p.onMenu(false);action();};
  return <header className="titlebar">
    <img className="titlebar-logo" src={logo} alt="Lullaby"/>
    <button className="shell-icon" aria-label={p.sidebarHidden?'Afficher la barre latérale':'Masquer la barre latérale'} title="Barre latérale (Ctrl+B)" aria-pressed={!p.sidebarHidden} onClick={p.onToggleSidebar}><ShellIcon name="rail"/></button>
    <button className="shell-icon" aria-label="Précédent" title="Précédent (Alt+←)" disabled={!p.canBack} onClick={p.onBack}><ShellIcon name="back"/></button>
    <button className="shell-icon" aria-label="Suivant" title="Suivant (Alt+→)" disabled={!p.canForward} onClick={p.onForward}><ShellIcon name="forward"/></button>
    <div className="project-switcher" ref={anchor}>
      <button className="project-switch" aria-haspopup="menu" aria-expanded={p.menuOpen} onClick={()=>p.onMenu(!p.menuOpen)}>
        {p.project?<ProjectEmblem projectId={p.project.id}/>:<ShellIcon name="atelier"/>}<span>{p.project?.name??'Atelier'}</span><ShellIcon name="chevron"/>
      </button>
      {p.menuOpen&&<div className="shell-menu" role="menu" aria-label="Changer de projet">
        <button role="menuitem" onClick={choose(p.onAtelier)}><ShellIcon name="atelier"/>Atelier</button>
        {p.projects.map(item=><button role="menuitem" key={item.id} onClick={choose(()=>p.onSelectProject(item.id))}><ProjectEmblem projectId={item.id}/>{item.name}<small>{count(item.id)} conv.</small></button>)}
      </div>}
    </div>
    {p.project&&<span className="titlebar-path" title={p.project.cwd}>{p.project.cwd}</span>}
    <div className="titlebar-drag"/>
    <div className="titlebar-tools">
      <button className="shell-icon" aria-label="Git" title="Git (Ctrl+J)" aria-pressed={p.panel==='git'} onClick={()=>p.onTogglePanel('git')}><ShellIcon name="git"/></button>
      <button className="shell-icon" aria-label="Aperçu" title="Aperçu" aria-pressed={p.panel==='preview'} onClick={()=>p.onTogglePanel('preview')}><ShellIcon name="preview"/></button>
    </div>
  </header>;
}
```

- [ ] **Step 4 : Vérifier**

Run: `npx vitest run tests/title-bar.test.tsx` puis `npm run typecheck`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/renderer/src/shell/TitleBar.tsx tests/title-bar.test.tsx
git commit -m "feat: add the 40 px Iris title bar"
```

---

### Task 10 : Barre latérale par conversations

**Files:**
- Create: `src/renderer/src/shell/Sidebar.tsx`
- Modify: `tests/sidebar.test.tsx`

- [ ] **Step 1 : Compléter le test**

Remplacer l'en-tête de `tests/sidebar.test.tsx` (imports) par :

```tsx
// @vitest-environment jsdom
import { createRef } from 'react';
import { afterEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,within } from '@testing-library/react';
import type { Phase,Session } from '../src/shared/contracts';
// Menu labels avoid the project and session titles so row queries stay unambiguous.
vi.mock('../src/renderer/src/app/ProjectActions',()=>({ProjectActions:({project}:any)=><button aria-label={`Menu projet ${project.id}`}/>}));
vi.mock('../src/renderer/src/app/SessionActions',()=>({SessionActions:({session}:any)=><button aria-label={`Menu ${session.id}`}/>}));
import { StateMark } from '../src/renderer/src/shell/StateMark';
import { Sidebar } from '../src/renderer/src/shell/Sidebar';
afterEach(cleanup);
```

Ajouter à la fin du fichier :

```tsx
const projects=[{id:'a',name:'Lullaby',cwd:'C:/a',folderKey:'a'},{id:'b',name:'Alice',cwd:'C:/b',folderKey:'b'},{id:'c',name:'Vide',cwd:'C:/c',folderKey:'c'}];
const session=(id:string,projectId:string,phase:Phase='idle'):Session=>({id,projectId,provider:'claude',title:`Session ${id}`,phase,draft:'',choices:{}});
const sessions=[...['1','2','3','4','5','6'].map(n=>session(`a${n}`,'a')),session('b1','b','waiting')];
function setup(extra={}){
  const p={projects,sessions,view:{kind:'session' as const,projectId:'a',sessionId:'a6'},query:'',collapsed:{},hidden:false,searchRef:createRef<HTMLInputElement>(),
    onQuery:vi.fn(),onToggleGroup:vi.fn(),onOpenSession:vi.fn(),onNewSession:vi.fn(),onAtelier:vi.fn(),onOpenFolder:vi.fn(),onSettings:vi.fn(),onProjectRemoved:vi.fn(),onSessionRemoved:vi.fn(),onError:vi.fn(),...extra};
  return {p,...render(<Sidebar {...p}/>)};
}
test('lists conversations by project, newest first, with the active one marked',()=>{
  const {p}=setup();
  const list=within(screen.getByRole('navigation',{name:'Conversations par projet'}));
  const rows=list.getAllByRole('button',{name:/Session a/});
  expect(rows.map(row=>row.textContent)).toEqual(['Session a6','Session a5','Session a4','Session a3','Session a2']);
  expect(rows[0].getAttribute('aria-current')).toBe('page');
  expect(list.getByText('Aucune conversation')).toBeTruthy();
  fireEvent.click(list.getByRole('button',{name:/Session b1/}));expect(p.onOpenSession).toHaveBeenCalledWith(sessions[6]);
  fireEvent.click(list.getByRole('button',{name:'Afficher tout (6)'}));expect(list.getByRole('button',{name:/Session a1/})).toBeTruthy();
});
test('group header toggles, creates in its project and signals attention when collapsed',()=>{
  const {p}=setup({collapsed:{b:true}});
  fireEvent.click(screen.getByRole('button',{name:'Alice',expanded:false}));expect(p.onToggleGroup).toHaveBeenCalledWith('b');
  expect(screen.getByRole('img',{name:'Une conversation attend votre attention'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Session b1/})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Nouvelle conversation dans Lullaby'}));expect(p.onNewSession).toHaveBeenCalledWith('a');
  fireEvent.click(screen.getByRole('button',{name:'Nouvelle conversation'}));expect(p.onNewSession).toHaveBeenLastCalledWith();
  fireEvent.click(screen.getByRole('button',{name:'Ouvrir un projet'}));expect(p.onOpenFolder).toHaveBeenCalled();
  expect(screen.getAllByRole('button',{name:'Paramètres'})).toHaveLength(1);
});
test('search reports typing, clears with Escape and explains empty results',()=>{
  const {p}=setup({query:'zzz'});
  const input=screen.getByRole('textbox',{name:'Rechercher une conversation'});
  fireEvent.change(input,{target:{value:'abc'}});expect(p.onQuery).toHaveBeenCalledWith('abc');
  fireEvent.keyDown(input,{key:'Escape'});expect(p.onQuery).toHaveBeenLastCalledWith('');
  expect(screen.getByText('Aucun résultat pour « zzz »')).toBeTruthy();
});
test('arrow keys move focus between sidebar rows',()=>{
  setup();
  const atelier=screen.getByRole('button',{name:'Atelier'});atelier.focus();
  fireEvent.keyDown(atelier,{key:'ArrowDown'});expect(document.activeElement).toBe(screen.getByRole('button',{name:'Lullaby',expanded:true}));
  fireEvent.keyDown(document.activeElement!,{key:'ArrowUp'});expect(document.activeElement).toBe(atelier);
});
test('hidden sidebar is inert',()=>{
  const {container}=setup({hidden:true});expect(container.querySelector('.sidebar')!.hasAttribute('inert')).toBe(true);
});
```

Le premier test (`state marks…`) reste inchangé entre ces deux blocs.

- [ ] **Step 2 : Vérifier l'échec**

Run: `npx vitest run tests/sidebar.test.tsx`
Expected: FAIL — `Sidebar` introuvable.

- [ ] **Step 3 : Implémenter**

```tsx
import { useState, type KeyboardEvent, type RefObject } from 'react';
import type { Project, Session } from '../../../shared/contracts';
import { ProjectActions } from '../app/ProjectActions';
import { ProjectEmblem } from '../app/ProjectEmblem';
import { SessionActions } from '../app/SessionActions';
import type { View } from './navigation';
import { ShellIcon } from './ShellIcon';
import { StateMark } from './StateMark';
import { sidebarGroups } from './sidebarModel';
type Props={projects:Project[];sessions:Session[];view:View;query:string;collapsed:Record<string,boolean>;hidden:boolean;searchRef:RefObject<HTMLInputElement|null>;
  onQuery:(query:string)=>void;onToggleGroup:(projectId:string)=>void;onOpenSession:(session:Session)=>void;onNewSession:(projectId?:string)=>void;
  onAtelier:()=>void;onOpenFolder:()=>void;onSettings:()=>void;onProjectRemoved:(projectId:string)=>void;onSessionRemoved:(sessionId:string)=>void;onError:(message:string)=>void};
export function Sidebar(p:Props){
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const active=p.view.kind==='session'?p.view.sessionId:undefined;const query=p.query.trim();
  const groups=sidebarGroups(p.projects,p.sessions,{query,collapsed:p.collapsed,expanded,active});
  function arrows(event:KeyboardEvent<HTMLElement>){
    if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
    const items=[...event.currentTarget.querySelectorAll<HTMLElement>('[data-nav-item]')];
    const next=items[items.indexOf(document.activeElement as HTMLElement)+(event.key==='ArrowDown'?1:-1)];
    if(items.includes(document.activeElement as HTMLElement)&&next){event.preventDefault();next.focus();}
  }
  return <aside className="sidebar" aria-label="Navigation" inert={p.hidden} onKeyDown={arrows}>
    <label className="sidebar-search"><ShellIcon name="search"/>
      <input ref={p.searchRef} value={p.query} placeholder="Rechercher" aria-label="Rechercher une conversation" onChange={event=>p.onQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')p.onQuery('');}}/><kbd>Ctrl K</kbd>
    </label>
    <button className="sidebar-row" data-nav-item onClick={()=>p.onNewSession()}><ShellIcon name="edit"/>Nouvelle conversation</button>
    <button className={`sidebar-row ${p.view.kind==='atelier'?'active':''}`} data-nav-item aria-current={p.view.kind==='atelier'?'page':undefined} onClick={p.onAtelier}><ShellIcon name="atelier"/>Atelier</button>
    <div className="sidebar-scroll">
      <div className="sidebar-section">Projets<button className="shell-icon small" aria-label="Ouvrir un projet" title="Ouvrir un projet" onClick={p.onOpenFolder}><ShellIcon name="plus"/></button></div>
      <nav aria-label="Conversations par projet">
        {groups.map(group=><div key={group.project.id} className={`sidebar-group ${group.collapsed?'collapsed':''}`}>
          <div className="sidebar-group-head">
            <button className="sidebar-group-toggle" data-nav-item aria-expanded={!group.collapsed} onClick={()=>p.onToggleGroup(group.project.id)}><ProjectEmblem projectId={group.project.id}/><span>{group.project.name}</span><ShellIcon name="chevron"/></button>
            {group.collapsed&&group.attention&&<i className="attention-dot" role="img" aria-label="Une conversation attend votre attention"/>}
            <span className="sidebar-group-actions">
              <button className="shell-icon small" aria-label={`Nouvelle conversation dans ${group.project.name}`} title="Nouvelle conversation" onClick={()=>p.onNewSession(group.project.id)}><ShellIcon name="plus"/></button>
              <ProjectActions project={group.project} onRemoved={()=>p.onProjectRemoved(group.project.id)} onError={p.onError}/>
            </span>
          </div>
          {!group.collapsed&&<ul className="sidebar-sessions">
            {group.sessions.map(session=><li key={session.id} className={`sidebar-session ${session.id===active?'active':''}`}>
              <button data-nav-item aria-current={session.id===active?'page':undefined} title={session.title} onClick={()=>p.onOpenSession(session)}><StateMark phase={session.phase}/><span>{session.title}</span></button>
              <SessionActions session={session} onRemoved={p.onSessionRemoved}/>
            </li>)}
            {!group.sessions.length&&<li className="sidebar-empty">Aucune conversation</li>}
            {group.hidden>0&&<li><button className="sidebar-more" data-nav-item onClick={()=>setExpanded(previous=>({...previous,[group.project.id]:true}))}>Afficher tout ({group.sessions.length+group.hidden})</button></li>}
          </ul>}
        </div>)}
        {query&&!groups.length&&<p className="sidebar-empty">Aucun résultat pour « {query} »</p>}
      </nav>
    </div>
    <div className="sidebar-footer"><button className="sidebar-row" data-nav-item onClick={p.onSettings}><ShellIcon name="settings"/>Paramètres</button></div>
  </aside>;
}
```

Note sur le test « lists conversations » : le nom accessible d'une ligne inclut le libellé d'état (`Prête Session a6`) ; `textContent` ne contient que le titre, d'où l'usage de `textContent` dans l'assertion.

- [ ] **Step 4 : Vérifier**

Run: `npx vitest run tests/sidebar.test.tsx` puis `npm run typecheck`
Expected: PASS (6 tests).

- [ ] **Step 5 : Commit**

```bash
git add src/renderer/src/shell/Sidebar.tsx tests/sidebar.test.tsx
git commit -m "feat: list conversations by project in the sidebar"
```

---

### Task 11 : Vues de contenu (conversation, nouvelle conversation, Atelier)

**Files:**
- Modify (réécriture): `src/renderer/src/app/ProjectSessions.tsx`
- Create: `src/renderer/src/shell/AtelierView.tsx`

Les tests de ces vues passent par `tests/shell-app.test.tsx` (Task 12) et par les tests existants de `ProjectOverview` et `SessionChat`.

- [ ] **Step 1 : Réécrire `ProjectSessions.tsx`**

```tsx
import { useState } from 'react';
import type { Diagnostic, Project, Provider, Session } from '../../../shared/contracts';
import { SessionChat } from '../chat/SessionChat';
import { ProviderLogo } from './UiIcon';
export const phaseLabel={idle:'Prêt',running:'Travaille',waiting:'Votre réponse',done:'Terminé',interrupted:'Interrompu',error:'À vérifier'};
// The engine is fixed when a conversation is created; the CLI import keeps its native history.
export function NewConversation({project,onCreated,onError}:{project:Project;onCreated:(sessionId:string)=>void;onError:(message:string)=>void}){
  const [creating,setCreating]=useState(false);const [native,setNative]=useState('');const [provider,setProvider]=useState<Provider>('claude');
  async function create(provider:Provider,nativeId?:string){setCreating(true);try{const result=await window.lullaby.createSession(project.id,provider,nativeId);if(result.ok){setNative('');onCreated(result.value.id);}else onError(result.message);}finally{setCreating(false);}}
  return <section className="new-conversation" aria-label={`Nouvelle conversation dans ${project.name}`}>
    <h1>Nouvelle conversation</h1><p className="muted">{project.name} · <span className="mono">{project.cwd}</span></p>
    <div className="engine-choice">
      <button className="engine-button" disabled={creating} onClick={()=>void create('claude')}><ProviderLogo provider="claude"/><span><strong>Claude Code</strong><small>Abonnement Claude</small></span></button>
      <button className="engine-button" disabled={creating} onClick={()=>void create('codex')}><ProviderLogo provider="codex"/><span><strong>Codex</strong><small>Abonnement ChatGPT</small></span></button>
    </div>
    <details className="import-session"><summary>Reprendre depuis la CLI</summary><p>Utilisez le même dossier et fermez d’abord la session dans l’autre client. L’historique antérieur reste dans le moteur ; le chat affiche les nouveaux échanges.</p><form onSubmit={e=>{e.preventDefault();void create(provider,native.trim());}}><label>Moteur<select value={provider} onChange={e=>setProvider(e.target.value as Provider)}><option value="claude">Claude Code</option><option value="codex">Codex</option></select></label><label>Identifiant natif<input value={native} onChange={e=>setNative(e.target.value)} placeholder="UUID de la session" required/></label><button className="shell-button" disabled={creating||!native.trim()}>Reprendre</button></form></details>
  </section>;
}
export function SessionView({session,diagnostic}:{session:Session;diagnostic?:Diagnostic}){
  return <section className="conversation"><SessionHeader session={session} diagnostic={diagnostic}/><SessionChat key={session.id} sessionId={session.id} diagnostic={diagnostic}/></section>;
}
function SessionHeader({session,diagnostic}:{session:Session;diagnostic?:Diagnostic}){
  return <header className="session-header"><h2 title={session.title}>{session.title}</h2><span className={`phase ${session.phase}`}>{phaseLabel[session.phase]}</span><span className="session-engine"><ProviderLogo provider={session.provider}/>{session.provider==='claude'?'Claude Code':'Codex · ChatGPT'}</span>{diagnostic?.configuredModelUnavailable&&!session.choices.model&&<p className="model-notice">Le modèle configuré n’est plus disponible. Choisissez un modèle près du bouton d’envoi.</p>}{diagnostic?.issues.map(issue=><p className="model-notice" key={issue}>{issue}</p>)}</header>;
}
```

- [ ] **Step 2 : Créer `AtelierView.tsx`**

```tsx
import type { Project, Session } from '../../../shared/contracts';
import logo from '../assets/lullaby.svg';
import { ProjectOverview } from '../app/ProjectOverview';
type Props={projects:Project[];sessions:Session[];remembered:Record<string,string|undefined>;onOpen:(projectId:string,sessionId?:string)=>void;onOpenFolder:()=>void};
export function AtelierView({projects,sessions,remembered,onOpen,onOpenFolder}:Props){
  if(!projects.length)return <section className="atelier-empty"><img src={logo} alt=""/><h1>Ouvrir un projet</h1><p>Ouvrez un dossier pour retrouver ici vos conversations et suivre le travail de vos agents.</p><button className="shell-button primary" onClick={onOpenFolder}>Choisir un dossier</button></section>;
  return <section className="atelier"><header className="main-header"><h1>Atelier</h1></header><div className="atelier-body"><ProjectOverview projects={projects} sessions={sessions} remembered={remembered} onOpen={onOpen}/></div></section>;
}
```

- [ ] **Step 3 : Vérifier les types**

Run: `npm run typecheck`
Expected: des erreurs uniquement dans `src/renderer/src/app/App.tsx` (export `ProjectSessions` disparu) ; elles sont corrigées en Task 12.

- [ ] **Step 4 : Commit**

Pas de commit isolé : l'application ne compile pas tant que `App.tsx` n'est pas réécrit. Enchaîner directement sur la Task 12, qui commite les deux.

---

### Task 12 : Assemblage dans `App.tsx`

**Files:**
- Modify (réécriture): `src/renderer/src/app/App.tsx`
- Delete: `src/renderer/src/app/ProjectWorkspace.tsx`
- Delete: `tests/project-navigation.test.tsx`
- Create: `tests/shell-app.test.tsx`

- [ ] **Step 1 : Écrire le test d'intégration**

```tsx
// @vitest-environment jsdom
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,within } from '@testing-library/react';
vi.mock('../src/renderer/src/app/ProjectSessions',()=>({
  SessionView:({session}:any)=><output aria-label="Conversation affichée">{session.id}</output>,
  NewConversation:({project}:any)=><output aria-label="Nouvelle conversation">{project.id}</output>,
}));
vi.mock('../src/renderer/src/app/ProjectActions',()=>({ProjectActions:()=>null}));
vi.mock('../src/renderer/src/app/SessionActions',()=>({SessionActions:()=>null}));
vi.mock('../src/renderer/src/settings/SettingsScreen',()=>({SettingsScreen:()=><div role="dialog" aria-label="Paramètres ouverts"/>}));
vi.mock('../src/renderer/src/git/GitView',()=>({GitView:({projectId}:any)=><output aria-label="Git affiché">{projectId}</output>}));
import { App } from '../src/renderer/src/app/App';
import { sessionStore } from '../src/renderer/src/chat/sessionStore';
beforeEach(()=>localStorage.clear());
afterEach(cleanup);
let revision=100;
function start(){
  const snapshot={revision:++revision,projects:['A','B'].map(id=>({id,name:`Projet ${id}`,cwd:`C:/${id}`,folderKey:id})),sessions:['A','B'].flatMap(projectId=>[1,2].map(n=>({id:`${projectId}-${n}`,projectId,provider:'claude' as const,title:`Session ${projectId}-${n}`,phase:'idle' as const,draft:'',choices:{}}))),messages:{},pending:[]};
  sessionStore.accept(snapshot);
  window.lullaby={subscribe:()=>()=>{},snapshot:async()=>({ok:true,value:snapshot}),diagnose:async()=>({ok:true,value:[]}),pickProject:vi.fn()} as any;
  return render(<App/>);
}
const shown=()=>screen.getByLabelText('Conversation affichée').textContent;
const sidebar=()=>within(screen.getByRole('navigation',{name:'Conversations par projet'}));
test('sidebar, history and the Atelier share one navigation',()=>{
  start();
  expect(screen.getByRole('region',{name:'État des projets'})).toBeTruthy();
  fireEvent.click(sidebar().getByRole('button',{name:/Session A-2/}));expect(shown()).toBe('A-2');
  expect(screen.getByRole('button',{name:/Projet A/,expanded:false})).toBeTruthy();
  fireEvent.click(sidebar().getByRole('button',{name:/Session B-1/}));expect(shown()).toBe('B-1');
  fireEvent.click(screen.getByRole('button',{name:'Précédent'}));expect(shown()).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Suivant'}));expect(shown()).toBe('B-1');
  fireEvent.keyDown(window,{key:'ArrowLeft',altKey:true});expect(shown()).toBe('A-2');
  fireEvent.click(screen.getByRole('button',{name:'Atelier'}));
  fireEvent.click(within(screen.getByRole('region',{name:'État des projets'})).getByRole('button',{name:/Projet A/}));
  expect(shown()).toBe('A-2');
  expect(screen.getAllByRole('button',{name:'Paramètres'})).toHaveLength(1);
});
test('new conversations open in the chosen project, or ask for one',()=>{
  start();
  fireEvent.click(screen.getByRole('button',{name:'Nouvelle conversation dans Projet B'}));
  expect(screen.getByLabelText('Nouvelle conversation').textContent).toBe('B');
  fireEvent.click(screen.getByRole('button',{name:'Atelier'}));
  fireEvent.keyDown(window,{key:'n',ctrlKey:true});
  fireEvent.click(screen.getByRole('menuitem',{name:/Projet A/}));
  expect(screen.getByLabelText('Nouvelle conversation').textContent).toBe('A');
});
test('sidebar and panel toggles are remembered and follow the current project',()=>{
  const {container}=start();
  fireEvent.keyDown(window,{key:'b',ctrlKey:true});
  expect(container.querySelector('.iris-shell')!.classList.contains('sidebar-hidden')).toBe(true);
  expect(localStorage.getItem('lullaby.sidebar-hidden')).toBe('true');
  fireEvent.keyDown(window,{key:'b',ctrlKey:true});
  fireEvent.click(sidebar().getByRole('button',{name:/Session B-2/}));
  fireEvent.keyDown(window,{key:'j',ctrlKey:true});
  expect(container.querySelector('.right-panel')!.classList.contains('open')).toBe(true);
  expect(screen.getByLabelText('Git affiché').textContent).toBe('B');
  fireEvent.click(screen.getByRole('button',{name:'Git'}));
  expect(container.querySelector('.right-panel')!.classList.contains('open')).toBe(false);
});
test('collapsing a group is remembered',()=>{
  start();
  fireEvent.click(screen.getByRole('button',{name:'Projet A',expanded:true}));
  expect(JSON.parse(localStorage.getItem('lullaby.sidebar-groups')!)).toEqual({A:true});
  expect(sidebar().queryByRole('button',{name:/Session A-1/})).toBeNull();
});
```

- [ ] **Step 2 : Supprimer l'ancien test et vérifier l'échec**

```bash
git rm tests/project-navigation.test.tsx
```

Run: `npx vitest run tests/shell-app.test.tsx`
Expected: FAIL — l'ancien `App` ne rend ni la navigation « Conversations par projet » ni les vues attendues.

- [ ] **Step 3 : Réécrire `App.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Diagnostic, Session } from '../../../shared/contracts';
import { SnapshotContext, sessionStore } from '../chat/sessionStore';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AtelierView } from '../shell/AtelierView';
import { back, canBack, canForward, currentView, forward, initialNavigation, navigate, prune, type View } from '../shell/navigation';
import { clampPanelWidth, defaultPanelWidth, type PanelTab } from '../shell/panel';
import { RightPanel } from '../shell/RightPanel';
import { ShellContext } from '../shell/ShellContext';
import { useShortcuts } from '../shell/shortcuts';
import { Sidebar } from '../shell/Sidebar';
import { isBoolean, isFlags, isNumber, usePersistentState } from '../shell/storage';
import { TitleBar } from '../shell/TitleBar';
import { projectFocus } from './ProjectOverview';
import { NewConversation, SessionView } from './ProjectSessions';
export function App(){
  const snapshot=useSyncExternalStore(sessionStore.subscribe,sessionStore.getSnapshot);
  const [nav,setNav]=useState(initialNavigation);const view=currentView(nav);
  const [remembered,setRemembered]=useState<Record<string,string|undefined>>({});
  const [sidebarHidden,setSidebarHidden]=usePersistentState('lullaby.sidebar-hidden',false,isBoolean);
  const [collapsed,setCollapsed]=usePersistentState<Record<string,boolean>>('lullaby.sidebar-groups',{},isFlags);
  const [panelWidth,setPanelWidth]=usePersistentState('lullaby.panel-width',defaultPanelWidth,isNumber);
  const [panel,setPanel]=useState<PanelTab>();const [previewSlot,setPreviewSlot]=useState<HTMLDivElement|null>(null);
  const [query,setQuery]=useState('');const [menuOpen,setMenuOpen]=useState(false);const [pendingNew,setPendingNew]=useState(false);
  const [notice,setNotice]=useState('');const [settings,setSettings]=useState(false);
  const [diagnostics,setDiagnostics]=useState<Record<string,Diagnostic[]>>({});const [loading,setLoading]=useState<string>();
  const searchRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{const unsubscribe=window.lullaby.subscribe(sessionStore.accept);void window.lullaby.snapshot().then(result=>{if(result.ok)sessionStore.accept(result.value);else setNotice(result.message);});return unsubscribe;},[]);
  useEffect(()=>{setNav(previous=>prune(previous,item=>item.kind==='atelier'||snapshot.projects.some(project=>project.id===item.projectId)&&(item.kind==='project'||snapshot.sessions.some(session=>session.id===item.sessionId))));},[snapshot]);
  const projectId=view.kind==='atelier'?undefined:view.projectId;
  const project=snapshot.projects.find(item=>item.id===projectId);
  const session=view.kind==='session'?snapshot.sessions.find(item=>item.id===view.sessionId):undefined;
  async function diagnose(id:string){setLoading(id);try{const result=await window.lullaby.diagnose(id);if(result.ok)setDiagnostics(previous=>({...previous,[id]:result.value}));else setNotice(result.message);}finally{setLoading(current=>current===id?undefined:current);}}
  useEffect(()=>{if(projectId&&!diagnostics[projectId])void diagnose(projectId);},[projectId]);
  function go(next:View){setNav(previous=>navigate(previous,next));if(next.kind==='session')setRemembered(previous=>({...previous,[next.projectId]:next.sessionId}));}
  const openSession=(item:Session)=>go({kind:'session',projectId:item.projectId,sessionId:item.id});
  function openProject(id:string,sessionId?:string){
    const own=snapshot.sessions.filter(item=>item.projectId===id);
    const focus=own.find(item=>item.id===sessionId)??projectFocus(own,remembered[id]);
    if(focus)openSession(focus);else go({kind:'project',projectId:id});
  }
  function newSession(target?:string){
    const id=target??projectId;
    if(id){setCollapsed(previous=>({...previous,[id]:false}));go({kind:'project',projectId:id});return;}
    if(!snapshot.projects.length){void openFolder();return;}
    setPendingNew(true);setMenuOpen(true);
  }
  function selectProject(id:string){if(pendingNew){setPendingNew(false);go({kind:'project',projectId:id});}else openProject(id);}
  async function openFolder(){const result=await window.lullaby.pickProject();if(result.ok&&result.value)go({kind:'project',projectId:result.value.id});else if(!result.ok)setNotice(result.message);}
  const togglePanel=(tab?:PanelTab)=>setPanel(current=>tab?(current===tab?undefined:tab):(current?undefined:'git'));
  const toggleSidebar=()=>setSidebarHidden(hidden=>!hidden);
  useShortcuts({toggleSidebar,togglePanel:()=>togglePanel(),newSession:()=>newSession(),back:()=>setNav(back),forward:()=>setNav(forward),
    search:()=>{setSidebarHidden(false);requestAnimationFrame(()=>searchRef.current?.focus());}});
  useEffect(()=>{const fit=()=>setPanelWidth(width=>clampPanelWidth(width,window.innerWidth));window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[setPanelWidth]);
  const shell=useMemo(()=>({openPanel:(tab:PanelTab)=>setPanel(tab),previewSlot}),[previewSlot]);
  const diagnostic=session&&diagnostics[session.projectId]?.find(item=>item.provider===session.provider);
  return <SnapshotContext.Provider value={snapshot}><ShellContext.Provider value={shell}>
    <div className={`shell iris-shell ${sidebarHidden?'sidebar-hidden':''} ${panel?'panel-open':''}`}>
      <TitleBar project={project} projects={snapshot.projects} sessions={snapshot.sessions} sidebarHidden={sidebarHidden} canBack={canBack(nav)} canForward={canForward(nav)} panel={panel} menuOpen={menuOpen}
        onMenu={open=>{setMenuOpen(open);if(!open)setPendingNew(false);}} onToggleSidebar={toggleSidebar} onBack={()=>setNav(back)} onForward={()=>setNav(forward)}
        onSelectProject={selectProject} onAtelier={()=>go({kind:'atelier'})} onTogglePanel={togglePanel}/>
      <div className="shell-body">
        <Sidebar projects={snapshot.projects} sessions={snapshot.sessions} view={view} query={query} collapsed={collapsed} hidden={sidebarHidden} searchRef={searchRef}
          onQuery={setQuery} onToggleGroup={id=>setCollapsed(previous=>({...previous,[id]:!previous[id]}))} onOpenSession={openSession} onNewSession={newSession}
          onAtelier={()=>go({kind:'atelier'})} onOpenFolder={()=>void openFolder()} onSettings={()=>setSettings(true)}
          onProjectRemoved={()=>go({kind:'atelier'})} onSessionRemoved={()=>undefined} onError={setNotice}/>
        <main className="main-area">
          {notice&&<div className="shell-notice" role="alert"><span>{notice}</span><button onClick={()=>setNotice('')}>Fermer</button></div>}
          {session&&project?<SessionView session={session} diagnostic={diagnostic}/>
            :project?<NewConversation key={project.id} project={project} onCreated={id=>go({kind:'session',projectId:project.id,sessionId:id})} onError={setNotice}/>
            :<AtelierView projects={snapshot.projects} sessions={snapshot.sessions} remembered={remembered} onOpen={openProject} onOpenFolder={()=>void openFolder()}/>}
        </main>
        <RightPanel tab={panel} width={panelWidth} projectId={project?.id} onTab={setPanel} onClose={()=>setPanel(undefined)} onResize={setPanelWidth} onSlot={setPreviewSlot}/>
      </div>
      {settings&&<SettingsScreen items={project?diagnostics[project.id]??[]:[]} loading={!!project&&loading===project.id} onRefresh={()=>{if(project)void diagnose(project.id);}} onClose={()=>{setSettings(false);if(project)void diagnose(project.id);}}/>}
    </div>
  </ShellContext.Provider></SnapshotContext.Provider>;
}
```

Les suppressions de projet et de conversation n'ont pas besoin de logique supplémentaire : le snapshot suivant les retire et l'effet `prune` nettoie l'historique. `onProjectRemoved` ramène explicitement à l'Atelier ; `onSessionRemoved` laisse la purge agir.

- [ ] **Step 4 : Supprimer `ProjectWorkspace.tsx`**

```bash
git rm src/renderer/src/app/ProjectWorkspace.tsx
```

- [ ] **Step 5 : Vérifier**

Run: `npx vitest run tests/shell-app.test.tsx`
Expected: PASS (4 tests).

Run: `npm run typecheck` puis `npm test`
Expected: aucune erreur de types ; toute la suite passe. Si un test échoue parce qu'il cherche l'ancien rail (`navigation` « Projets », bouton « Réseau », classe `compact`), l'adapter à la nouvelle coquille plutôt que de réintroduire l'ancien comportement.

- [ ] **Step 6 : Commit**

```bash
git add -A src/renderer/src tests
git commit -m "feat: assemble the Iris shell around conversations and panels"
```

---

### Task 13 : Densité du contenu (chat, Atelier, Git, paramètres)

**Files:**
- Modify: `src/renderer/src/styles/shell.css` (ajout en fin de fichier)

- [ ] **Step 1 : Ajouter les règles de contenu**

```css
/* Content density shared by chat, Atelier, Git and settings. */
.iris-shell h1{letter-spacing:0}
.iris-shell .conversation{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}
.iris-shell .session-header{flex-wrap:nowrap;gap:8px;height:40px;max-height:none;padding:0 16px;background:none;overflow:visible}
.iris-shell .session-header h2{flex:1;min-width:0;margin:0;font-size:var(--text-sm);font-weight:600}
.iris-shell .session-engine{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:var(--text-xs);white-space:nowrap}
.iris-shell .session-engine .provider-logo{width:14px;height:14px}
.iris-shell .session-header .model-notice{position:absolute;margin:40px 0 0;font-size:var(--text-xs)}
.iris-shell .phase{margin:0;padding:2px 6px;border-radius:4px;font-size:var(--text-xs);font-weight:600}
.iris-shell .chat-viewport{padding:24px max(24px,calc((100% - 860px)/2)) 8px}
.iris-shell .message{margin:0 auto 20px}
.iris-shell .message-content,.iris-shell .message-content p{font-size:var(--chat-font);line-height:1.5}
.iris-shell .message.user .message-content{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:8px 12px}
.iris-shell .message-content h1,.iris-shell .message-content h2,.iris-shell .message-content h3{font-size:var(--text-lg)}
.iris-shell .composer-area{padding:0 max(24px,calc((100% - 860px)/2)) 12px}
.iris-shell .composer{border-color:var(--line);border-radius:var(--radius-lg);background:var(--surface);box-shadow:none}
.iris-shell .composer:focus-within{border-color:#b7a9e2;box-shadow:0 0 0 3px #6551ad14}
.iris-shell .composer-input{min-height:44px;padding:10px 12px 4px;font-size:var(--text-md)}
.iris-shell .composer-footer{padding:4px 8px 8px}
.iris-shell .send-button{width:var(--control);height:var(--control);border-radius:var(--radius)}
.iris-shell .chat-empty h2{font-size:var(--text-lg);letter-spacing:0}
.new-conversation{display:flex;flex-direction:column;gap:12px;width:100%;max-width:560px;margin:48px auto;padding:0 24px;box-sizing:border-box}
.new-conversation h1{margin:0;font-size:var(--text-lg);font-weight:600}
.new-conversation .muted{margin:0;color:var(--muted)}
.new-conversation .mono{font:var(--text-xs) 'Cascadia Code',Consolas,monospace}
.engine-choice{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.engine-button{display:flex;align-items:center;gap:10px;height:56px;padding:0 12px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface);text-align:left;cursor:pointer;transition:border-color var(--fast)}
.engine-button:hover{border-color:#b7a9e2}
.engine-button .provider-logo{width:20px;height:20px}
.engine-button small{display:block;color:var(--faint);font-size:var(--text-xs)}
.atelier{display:flex;flex-direction:column;flex:1;min-height:0}
.atelier-body{flex:1;overflow:auto;padding:20px max(24px,calc((100% - 860px)/2))}
.iris-shell .project-rows{border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--surface);overflow:hidden}
.iris-shell .project-row{min-height:44px;padding:0 12px;border-radius:0;font-size:var(--text-sm)}
.iris-shell .overview-emblem .project-emblem{width:18px;height:20px;filter:none}
.atelier-empty{max-width:420px;margin:auto;padding:24px;text-align:center}
.atelier-empty img{width:48px;height:53px}
.atelier-empty h1{margin:12px 0 4px;font-size:var(--text-lg);font-weight:600}
.atelier-empty p{margin:0 0 16px;color:var(--muted)}
.right-panel .git-view{gap:8px;padding:8px;font-size:var(--text-sm)}
.right-panel .git-inspection{grid-template-columns:1fr}
.iris-shell .settings-backdrop{font-size:var(--text-sm)}
.iris-shell .settings-backdrop h2{font-size:var(--text-lg)}
```

- [ ] **Step 2 : Lancer l'application et comparer à la maquette**

Run: `npm run dev` (en arrière-plan) puis ouvrir `docs/mockups/iris-shell.html` dans un navigateur à côté.

Vérifier, et ajuster uniquement les valeurs de `shell.css` en cas d'écart :
- barre de titre de 40 px, boutons Windows natifs à droite, zone vide déplaçable, menus cliquables ;
- lignes de la barre latérale de 32 px, texte 13 px, groupes repliables ;
- messages en 14 px dans une colonne centrée, zone de saisie compacte ;
- panneau Git lisible à 420 px et redimensionnable ;
- aperçu HTML (bloc de code HTML → « Aperçu ») affiché dans le panneau droit ;
- Paramètres : densité cohérente, aucun titre de 30 px ou plus.

- [ ] **Step 3 : Vérifier la suite**

Run: `npm run typecheck` puis `npm test`
Expected: tout passe.

- [ ] **Step 4 : Commit**

```bash
git add src/renderer/src/styles/shell.css
git commit -m "style: apply Iris density to chat, Atelier, Git and settings"
```

---

### Task 14 : Nettoyage, documentation et recette

**Files:**
- Modify: `src/renderer/src/styles/iris.css`, `src/renderer/src/styles/studio.css` (règles mortes)
- Modify: `src/renderer/src/app/UiIcon.tsx` (retrait d'`AtelierIcon` s'il n'est plus importé)
- Modify: `docs/direction-artistique.md`, `docs/etat-projet.md`, `README.md`
- Create: `docs/validation/iris-shell.md`

- [ ] **Step 1 : Lister les classes CSS devenues inutilisées**

Run :

```bash
node -e "const fs=require('fs'),path=require('path');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);const code=walk('src/renderer/src').filter(f=>/\.tsx?$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');for(const css of ['src/renderer/src/styles/iris.css','src/renderer/src/styles/studio.css']){const names=new Set([...fs.readFileSync(css,'utf8').matchAll(/\.([a-z][a-z0-9-]*)/g)].map(m=>m[1]));console.log(css,[...names].filter(n=>!code.includes(n)).join(' '));}"
```

Expected: une liste de classes par fichier, dont au moins `rail`, `brand`, `rail-caption`, `rail-button`, `topbar`, `breadcrumb`, `project-view-tabs`, `sessions-list`, `session-card`, `welcome-card`, `page-heading`.

- [ ] **Step 2 : Supprimer les règles de ces classes**

Pour chaque classe listée, supprimer dans `iris.css`/`studio.css` les règles dont **tous** les sélecteurs ne ciblent que des classes inutilisées. Garder une règle si l'un de ses sélecteurs vise encore une classe utilisée. Ne pas toucher aux classes fabriquées dynamiquement (`phase`, `running`, `waiting`, `done`, `error`, `interrupted`, `idle`, `has-preview`, `has-review`, `compact`) : les vérifier à la main avec `rg "<classe>" src/renderer`.

Retirer `AtelierIcon` de `UiIcon.tsx` si `rg AtelierIcon src` ne renvoie plus que sa définition.

La spec retire Georgia : seule la règle `.engine-monogram` l'utilise. Si `engine-monogram` n'apparaît plus dans `src/renderer`, supprimer la règle ; sinon remplacer `font-family:Georgia,serif` par `font-family:inherit`. Vérifier ensuite que `rg Georgia src` ne renvoie rien.

- [ ] **Step 3 : Vérifier**

Run: `npm run typecheck` puis `npm test`
Expected: tout passe, y compris « the graph keeps full dimensions under the application icon stylesheet » dans `tests/git-view.test.tsx`.

- [ ] **Step 4 : Mettre à jour la documentation**

Dans `docs/direction-artistique.md`, remplacer le paragraphe de la section « Navigation et mouvement » qui commence par « Navigation repliable demandée par l'utilisateur » par :

```
Coquille Iris validée le 28 septembre 2026 ([spec](superpowers/specs/2026-09-28-iris-shell-design.md),
[maquette](mockups/iris-shell.html)) : une barre de titre de 40 px remplace la barre
Windows et l'en-tête, la barre latérale liste les conversations groupées par projet
et se masque entièrement (`Ctrl+B`, choix mémorisé). La barre compacte de 76 px
disparaît. Git et les aperçus s'ouvrent dans un panneau droit (`Ctrl+J`).
Densité : texte 13–14 px, lignes de 32 px, titres limités à 16 px.
```

Dans `docs/etat-projet.md`, ajouter une ligne sous l'état courant :

```
- Coquille Iris dense (`feature/iris-shell`) : barre de titre intégrée, conversations
  par projet, panneau droit Git/Aperçu. Recette : [iris-shell](validation/iris-shell.md).
```

Dans `README.md`, remplacer le paragraphe qui commence par « La branche `feature/git-inspector` ajoute » par :

```
Interface : coquille Iris dense (barre de titre intégrée, conversations par projet,
panneau droit Git/Aperçu). Voir la [direction artistique](docs/direction-artistique.md).
```

- [ ] **Step 5 : Faire la recette et la consigner**

Lancer `npm run dev`, puis capturer la fenêtre dans ces états : Atelier, conversation, panneau Git ouvert, aperçu HTML ouvert, barre latérale masquée, fenêtre à 900 px de large. Capture possible avec PowerShell (`PrintWindow` sur le handle de la fenêtre « Lullaby »), en enregistrant les images dans le dossier scratchpad de la session, pas dans le dépôt.

Créer `docs/validation/iris-shell.md` :

```
# Recette — coquille Iris

Date : <date de la recette>. Branche `feature/iris-shell`.
Référence : [maquette](../mockups/iris-shell.html), [spec](../superpowers/specs/2026-09-28-iris-shell-design.md).

| Vérification | Résultat |
| --- | --- |
| Barre de titre 40 px, boutons Windows natifs, fenêtre déplaçable | |
| Barre latérale : groupes par projet, lignes 32 px, repli mémorisé | |
| Recherche (`Ctrl+K`, Échap) | |
| Précédent/suivant (boutons et `Alt+←/→`) | |
| Nouvelle conversation (+ d'un groupe, `Ctrl+N` sans projet) | |
| Panneau droit : Git, Aperçu HTML, redimensionnement, `Ctrl+J` | |
| Fenêtre < 1 000 px : panneau par-dessus le chat | |
| Sans animations et mouvement réduit respectés | |
| Focus visible et navigation au clavier dans la barre latérale | |
| `npm test` et `npm run typecheck` | |

Écarts constatés et suites : …
```

Remplir chaque ligne (OK / écart décrit) d'après la recette réelle ; ne rien cocher qui n'a pas été vérifié.

- [ ] **Step 6 : Commit**

```bash
git add -A src/renderer/src/styles src/renderer/src/app/UiIcon.tsx docs README.md
git commit -m "docs: record the Iris shell and remove the old rail styles"
```

---

## Hors périmètre

- Le volet de revue de tour (`TurnReviewPane`) reste dans la zone de conversation ; le déplacer dans le panneau droit est une étape ultérieure.
- Terminal dans le panneau droit, recherche dans le contenu des messages, date relative des conversations (le snapshot n'a pas d'horodatage).
- Fusion vers `develop` et publication : soumises à l'autorisation de l'utilisateur.
