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
