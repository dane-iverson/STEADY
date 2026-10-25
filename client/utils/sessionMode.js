const TOKEN_KEY = "steady-token";
const PROTOTYPE_KEY = "steady-prototype";
const PROTOTYPE_GROUP_KEY = "steady-prototype-group";
const PROTOTYPE_TOUR_KEY = "steady-prototype-tour-complete";

export function resolveStoredSession(storage) {
  const isPrototype = storage.getItem(PROTOTYPE_KEY) === "true";
  if (isPrototype) {
    storage.removeItem(TOKEN_KEY);
    return { token: "", isPrototype: true };
  }
  return { token: storage.getItem(TOKEN_KEY) || "", isPrototype: false };
}

export function enterPrototypeSession(storage, group) {
  storage.removeItem(TOKEN_KEY);
  storage.setItem(PROTOTYPE_KEY, "true");
  storage.setItem(PROTOTYPE_GROUP_KEY, group);
  storage.removeItem(PROTOTYPE_TOUR_KEY);
}

export function enterAuthenticatedSession(storage, token) {
  storage.removeItem(PROTOTYPE_KEY);
  storage.removeItem(PROTOTYPE_GROUP_KEY);
  storage.removeItem(PROTOTYPE_TOUR_KEY);
  storage.setItem(TOKEN_KEY, token);
}

export function hasActiveAuthSession(token, isPrototype, storage) {
  return Boolean(
    token &&
      !isPrototype &&
      storage.getItem(TOKEN_KEY) === token &&
      storage.getItem(PROTOTYPE_KEY) !== "true",
  );
}