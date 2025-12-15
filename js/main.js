import { login } from "./auth.js";
import { buildNav } from "./ui-router.js";
import { renderModule } from "./view.js";
import { state } from "./state.js";
import { requirementsModule } from "./modules/requirements.js";
import { candidatesModule } from "./modules/candidates.js";
import { callsModule } from "./modules/calls.js";
import { interviewsModule } from "./modules/interviews.js";
import { testsModule } from "./modules/tests.js";
import { adminModule } from "./modules/admin.js";

const modules = [
  requirementsModule,
  candidatesModule,
  callsModule,
  interviewsModule,
  testsModule,
  adminModule,
];

const userInfo = document.getElementById("user-info");
const loginBtn = document.getElementById("login-btn");

const refreshUser = () => {
  const nameEl = userInfo.querySelector(".user-name");
  if (state.user) {
    nameEl.textContent = `${state.user.name} (${state.user.role})`;
    loginBtn.textContent = "Logout";
    loginBtn.onclick = () => window.location.reload();
  }
};

const bootstrap = async () => {
  buildNav(modules);
  renderModule(modules.find((m) => m.id === state.currentModule));

  loginBtn.onclick = async () => {
    await login();
    refreshUser();
  };
};

bootstrap();
