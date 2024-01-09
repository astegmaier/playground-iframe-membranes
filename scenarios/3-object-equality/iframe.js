const listeners = new Set();
window.addEventListener = (listener) => {
  listeners.add(listener);
};
window.removeEventListener = (listener) => {
  listeners.delete(listener);
};
window.listenersCount = () => listeners.size;
