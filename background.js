chrome.runtime.onInstalled.addListener(() => {
  // Create a context menu item
  chrome.contextMenus.create({
    id: "sampleContextMenu",
    title: "Your Context Menu Item",
    contexts: ["selection"],
  });
});

let selectedText = '';

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sampleContextMenu") {
    prompt('pera') // probaj ovo
    selectedText = info.selectionText;
  }
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((request) => {
    if (request.action === "requestSelectedText") {
      port.postMessage({ action: "selectedText", selectedText });
    }
  });
});
