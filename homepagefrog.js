// Spawn ambient bubbles — matches froghunt and memory game pages

function spawnBubbles() {
  const container = document.getElementById("bubbles");
  for (let i = 0; i < 14; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    const size = Math.random() * 32 + 10;
    b.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 14 + 8}s;
      animation-delay: ${Math.random() * 12}s;
      opacity: ${Math.random() * 0.35 + 0.08};
    `;
    container.appendChild(b);
  }
}

document.addEventListener("DOMContentLoaded", spawnBubbles);
