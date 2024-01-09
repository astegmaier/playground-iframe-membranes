export function runScenario(iframe) {
  const listener = () => console.log("hello");
  iframe.contentWindow.addEventListener(listener);
  // The proxy membrane must be smart and not create an additional proxy for the 'listener' that wouldn't be '===' to the original.
  iframe.contentWindow.removeEventListener(listener);
  const listenersCount = iframe.contentWindow.listenersCount();
  listenersCount === 0 ? console.log("listener successfully removed!") : console.error("listener not removed!");
}
