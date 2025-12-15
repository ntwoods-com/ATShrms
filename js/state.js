import { getSession } from "./auth.js";

export const State = {
  session: getSession(),
  user() { return this.session?.user || null; },
  permissions() { return this.session?.user?.permissions || []; },
  has(p) { return this.permissions().includes(p); }
};
