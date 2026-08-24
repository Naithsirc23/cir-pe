export type ProjectTracking = {
  nextAction: string | null;
  blockerReason: string | null;
};

export type ProjectTrackingStorage = Pick<Storage, "getItem" | "setItem">;

const keyFor = (projectId: number) => `cir-project-tracking:${projectId}`;

function browserStorage(): ProjectTrackingStorage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function normalizeProjectTracking(input: Partial<ProjectTracking>): ProjectTracking {
  const normalize = (value: string | null | undefined) => value?.trim() || null;
  return {
    nextAction: normalize(input.nextAction),
    blockerReason: normalize(input.blockerReason),
  };
}

export function loadProjectTracking(projectId: number, fallback: ProjectTracking, storage = browserStorage()): ProjectTracking {
  if (!storage) return normalizeProjectTracking(fallback);
  try {
    const saved = storage.getItem(keyFor(projectId));
    return saved ? normalizeProjectTracking(JSON.parse(saved) as Partial<ProjectTracking>) : normalizeProjectTracking(fallback);
  } catch {
    return normalizeProjectTracking(fallback);
  }
}

export function saveProjectTracking(projectId: number, tracking: ProjectTracking, storage = browserStorage()) {
  if (!storage) return;
  storage.setItem(keyFor(projectId), JSON.stringify(normalizeProjectTracking(tracking)));
}
