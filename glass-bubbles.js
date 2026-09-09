(() => {
  const messages = document.getElementById("messages");
  if (!messages) return;

  const selector = ".message-row .bubble";
  const options = { bevel: 20, thickness: 18, blur: 2, dispersion: 0, rim: .62, smooth: 1, settle: 120 };
  const bubblesIn = node => node.nodeType === 1
    ? [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]
    : [];

  const observer = new IntersectionObserver(entries => {
    let changed = false;
    entries.forEach(entry => {
      entry.target.classList.toggle("is-glass-active", entry.isIntersecting);
      if (window.Hyalite) {
        if (entry.isIntersecting) Hyalite.attach(entry.target, options);
        else Hyalite.detach(entry.target);
      }
      changed = true;
    });
    if (changed) messages.dispatchEvent(new Event("glassvisibilitychange"));
  }, { root: messages, rootMargin: "640px 0px" });

  const observe = node => bubblesIn(node).forEach(bubble => observer.observe(bubble));
  const release = node => bubblesIn(node).forEach(bubble => {
    observer.unobserve(bubble);
    if (window.Hyalite) Hyalite.detach(bubble);
  });

  observe(messages);
  new MutationObserver(mutations => mutations.forEach(mutation => {
    mutation.addedNodes.forEach(observe);
    mutation.removedNodes.forEach(release);
  })).observe(messages, { childList: true, subtree: true });

  if (!CSS.supports("-webkit-touch-callout", "none")) return;
  const syncSafari = () => {
    const hostRect = document.body.getBoundingClientRect();
    const image = getComputedStyle(document.body).backgroundImage;
    const size = `${innerWidth}px ${innerHeight}px`;
    messages.querySelectorAll(`${selector}.is-glass-active`).forEach(bubble => {
      const rect = bubble.getBoundingClientRect();
      bubble.style.setProperty("--safari-lens-image", image);
      bubble.style.setProperty("--safari-lens-size", size);
      bubble.style.setProperty("--safari-lens-position", `${hostRect.left - rect.left}px ${hostRect.top - rect.top}px`);
    });
  };

  let frame = 0;
  const queueSafari = () => {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      syncSafari();
    });
  };
  messages.addEventListener("scroll", queueSafari, { passive: true });
  messages.addEventListener("glassvisibilitychange", queueSafari);
  window.addEventListener("resize", queueSafari, { passive: true });
  queueSafari();
})();
