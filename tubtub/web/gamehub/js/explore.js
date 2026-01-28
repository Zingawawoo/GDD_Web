const buttons = document.querySelectorAll(".explore-buttons button");
const results = document.getElementById("explore-results");

buttons.forEach(btn => {
  btn.onclick = () => loadExplore(btn.dataset.mode);
});

async function loadExplore(mode) {
  let endpoint =
    mode === "year" ? "/api/explore/by-year" :
    mode === "platform" ? "/api/explore/by-platform" :
    "/api/explore/by-genre";

  const res = await fetch(endpoint);
  const data = await res.json();

  results.innerHTML = "";

  Object.keys(data).forEach(group => {
    data[group].forEach(game => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${game.imageUrl}" />
        <h3>${game.name}</h3>
        <p>${group}</p>
      `;
      results.appendChild(card);
    });
  });
}
