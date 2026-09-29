import { createContext } from 'react';
import type { PanelTab } from './panel';
export type Shell={openPanel:(tab:PanelTab)=>void;previewSlot:HTMLElement|null};
// Outside the shell (tests, isolated views) previews stay inline in the chat.
export const ShellContext=createContext<Shell>({openPanel:()=>{},previewSlot:null});
