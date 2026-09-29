import { createContext } from 'react';
import type { PanelTab } from './panel';
export type Shell={openPanel:(tab:PanelTab)=>void;openGit?:()=>void;previewSlot:HTMLElement|null};
// Outside the shell (tests, isolated views) previews stay inline in the chat and Git is not offered.
export const ShellContext=createContext<Shell>({openPanel:()=>{},previewSlot:null});
