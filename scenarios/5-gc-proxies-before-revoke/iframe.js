class BigClass {
  constructor(instanceNumber) {
    this.stuff = Array(1000000)
      .fill(0)
      .map(() => Math.random());
    this.instanceNumber = instanceNumber;
  }
}

window.getIframeObject = (instanceNumber) => {
  return new BigClass(instanceNumber);
};
