// SVG shapes derived from the approved Iris mockup; the Lullaby mark is excluded.
const glyphs=[
  {name:'montagne',path:'m20 11 13 22h-7l-6-11-6 11H7z'},
  {name:'livre',path:'m10 14 10 5 10-5v18l-10 5-10-5zm4 7v8l4 2v-8zm8 2v8l4-2v-8z'},
  {name:'cristal',path:'m20 10 11 12-11 15L9 22zm0 6-5 6 5 8 5-8z'},
  {name:'boussole',path:'m20 9 4 10 9 4-9 4-4 11-4-11-9-4 9-4zm0 9-3 5 3 5 3-5z'},
  {name:'feuille',path:'M29 11C12 10 7 22 13 30l-3 5 4 2 3-6c11 2 15-9 12-20zm-5 6-8 12-2-2z'},
  {name:'tour',path:'M10 12h5v5h3v-5h4v5h3v-5h5v10l-3 3v11H13V25l-3-3zm8 15v7h4v-7z'},
  {name:'éclair',path:'m22 9-12 16h9l-2 13 14-19h-9z'},
  {name:'portail',path:'m10 16 10-6 10 6v19h-7V21l-3-2-3 2v14h-7z'},
];
const palettes=[['#7f68b6','#c5b2ef','#4c3b7a','#f2eaff'],['#73ab9a','#bce0c9','#366e64','#edfff0'],['#c6a165','#efdbac','#927245','#fff7da']];
export function projectIdentity(projectId:string) {
  let hash=2166136261;
  for(const char of projectId)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  return {glyph:hash%glyphs.length,tone:Math.floor(hash/glyphs.length)%palettes.length};
}
export function ProjectEmblem({projectId}:{projectId:string}) {
  const {glyph,tone}=projectIdentity(projectId);const [base,light,shade,ink]=palettes[tone];
  return <svg className="project-emblem" viewBox="0 0 40 44" aria-hidden="true" data-emblem={`${glyphs[glyph].name}-${tone}`}>
    <path fill={base} d="M20 0 39 10v24L20 44 1 34V10z"/>
    <path fill={light} d="m20 4 14 8-14 8-14-8z"/>
    <path fill={shade} d="m20 20 14-8v19L20 39z"/>
    <path fill={ink} fillRule="evenodd" d={glyphs[glyph].path}/>
  </svg>;
}
