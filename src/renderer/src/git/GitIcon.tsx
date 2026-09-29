const paths={
  branch:'M6 3v12a3 3 0 1 0 3 3 M6 6a3 3 0 1 0 0-6 M6 12c8 0 12-2 12-6 M18 6a3 3 0 1 0 0-6',
  remote:'M8 18H6a4 4 0 0 1-1-8 7 7 0 0 1 13-2 5 5 0 0 1 0 10h-2 M12 12v10 M8 16l4-4 4 4',
  tag:'M3 3h9l9 9-9 9-9-9z M8 7h.01',
  commit:'M2 12h6 M16 12h6 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  parent:'M6 20V7h12 M14 3l4 4-4 4 M6 20h.01',
};
export function GitIcon({name}:{name:keyof typeof paths}) {
  return <svg className="git-detail-icon" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
