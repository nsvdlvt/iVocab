type StageLabel =
  | "middleware"
  | "middleware auth"
  | "route"
  | "route:root-layout"
  | "route:app-layout"
  | "requireUser"
  | "getCurrentUser"
  | "createServerClient";

let perfCounter = 0;

export function perfStart(label: StageLabel, detail?: string) {
  const key = detail ? `${label}:${detail}` : `${label}#${++perfCounter}`;
  console.time(key);
  return key;
}

export function perfEnd(key: string) {
  console.timeEnd(key);
}
