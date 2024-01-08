window.getIframeObject = () => {
  return {}; // This newly-created object retains an implicit reference to the iframe window's realm.
};

window.bigObject = Array(1000000)
  .fill(0)
  .map(() => Math.random());
