const formatAction = (action) => {
  const btn = document.createElement("button");
  btn.className = `btn ${action.intent === "secondary" ? "secondary" : ""}`;
  btn.textContent = action.label;
  btn.dataset.action = action.action;
  btn.onclick = () => {
    console.log(`Trigger action: ${action.action}`);
  };
  return btn;
};

const buildCard = (data) => {
  const tpl = document.getElementById("module-card");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".card__eyebrow").textContent = data.eyebrow;
  node.querySelector(".card__title").textContent = data.title;
  node.querySelector(".card__body").textContent = data.body;
  node.querySelector(".status-pill").textContent = data.status;

  const footer = node.querySelector(".card__footer");
  data.actions.forEach((a) => footer.appendChild(formatAction(a)));
  return node;
};

export const renderModule = (moduleDef) => {
  const container = document.getElementById("content");
  container.innerHTML = "";

  const header = document.createElement("div");
  header.className = "card";
  header.innerHTML = `
    <div class="card__header">
      <div>
        <p class="card__eyebrow">Module</p>
        <h2 class="card__title">${moduleDef.label}</h2>
      </div>
      <div class="card__footer">
        ${moduleDef.badges.map((b) => `<span class="badge">${b}</span>`).join("" )}
      </div>
    </div>
    <p class="card__body">${moduleDef.description}</p>
  `;

  const cards = document.createElement("div");
  cards.className = "cards";
  moduleDef.cards.forEach((card) => cards.appendChild(buildCard(card)));

  container.appendChild(header);
  container.appendChild(cards);
};
