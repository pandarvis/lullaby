export type PanelTab='git'|'preview';
export const panelTabs:[PanelTab,string][]=[['git','Git'],['preview','Aperçu']];
export const minPanelWidth=320;
export const defaultPanelWidth=420;
export function clampPanelWidth(width:number,viewport:number){
  return Math.round(Math.min(Math.max(minPanelWidth,viewport*.6),Math.max(minPanelWidth,width)));
}
