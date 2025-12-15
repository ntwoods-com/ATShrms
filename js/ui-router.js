import { state, setModule } from "./state.js";
import { renderModule } from "./view.js";

export const buildNav = (modules) => {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";
  modules.forEach((mod) => {
    const btn = document.createElement("button");
    btn.className = `nav-item ${state.currentModule === mod.id ? "active" : ""}`;
    btn.textContent = mod.label;
    btn.onclick = () => {
      setModule(mod.id);
      buildNav(modules);
      renderModule(mod);
    };
    nav.appendChild(btn);
  });
};
