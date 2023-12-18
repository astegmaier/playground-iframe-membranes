window.leakyThingRetainerSet = new Set();

class LeakyThing {}

document.getElementById("add-iframe").onclick = async () => {
  const iframe = await getIframe();

  console.log(`Adding a LeakyThing to leakyThingRetainerArray.`);
  const leakyThing = new LeakyThing();
  leakyThingRetainerSet.add(leakyThing);

  // If the iframe is removed before iframe.contentWindow.wait() completes, execution of this function will stop.
  // No error is thrown by iframe.contentWindow.wait(), and the leakyThing will not be cleaned up.
  try {
    await iframe.contentWindow.wait(3000);
  } catch (error) {
    console.log("Caught this error from iframe promise:", error.message);
  }

  leakyThingRetainerSet.delete(leakyThing);
  console.log(
    `Cleaned up a LeakyThing. ${window.leakyThingRetainerSet.size} LeakyThings remain.`
  );
};

function getIframe() {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="text/javascript" src="./iframe.js"></script>
      </head>
      <body>
        <h1>Hi, I am an iframe.</h1>
      </body>
      </html>
    `;
    document.getElementById("iframe-container").appendChild(iframe);
  });
}

document.getElementById("remove-iframes").onclick = () => {
  document.getElementById("iframe-container").textContent = "";
  console.log(
    `Iframe removed. We have leaked ${window.leakyThingRetainerSet.size} LeakyThings right now.`
  );
};
