// Git opens as a full-width view (View kind 'git'); the panel keeps what is read beside a conversation.
export type PanelTab='preview';
export const panelTabs:[PanelTab,string][]=[['preview','Aperçu']];
export const minPanelWidth=320;
export const defaultPanelWidth=420;
export function clampPanelWidth(width:number,viewport:number){
  return Math.round(Math.min(Math.max(minPanelWidth,viewport*.6),Math.max(minPanelWidth,width)));
}
