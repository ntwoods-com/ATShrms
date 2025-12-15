import { initAuth } from "./auth.js";
import { render } from "./ui-router.js";
import { subscribe, setState } from "./state.js";
import { defaultRequirementTemplate } from "./config.js";

initAuth();
subscribe((state) => console.debug("STATE", state));
render({});

// Seed with template requirement for demo
setState({
  requirement: {
    id: "R-NEW",
    status: "PENDING_HR_REVIEW",
    ...defaultRequirementTemplate
  }
});
