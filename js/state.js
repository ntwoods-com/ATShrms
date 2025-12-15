import { render } from "./ui-router.js";

const subscribers = [];

const initialState = {
  session: null,
  requirement: null,
  candidates: [],
  calls: [],
  interviews: [],
  tests: [],
  audit: []
};

let state = structuredClone(initialState);

export function subscribe(fn) {
  subscribers.push(fn);
}

export function setState(patch) {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn(state));
  render(state);
}

export function getState() {
  return state;
}

export function resetState() {
  state = structuredClone(initialState);
  render(state);
}
