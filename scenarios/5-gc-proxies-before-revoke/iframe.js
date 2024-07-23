let instanceNumber = 0;

class BigClass {
  constructor() {
    this.stuff = Array(1000000)
      .fill(0)
      .map(() => Math.random());
    this.instanceNumber = instanceNumber++;
  }
}

window.getIframeObject = () => {
  return new BigClass();
};
