var API_KEY = false;
window.addEventListener("load", () => {
  chrome.storage.local.get(["gpt_api_key"], function (result) {
    if (result.gpt_api_key) {
      API_KEY = result.gpt_api_key;
      renderExtension();
    } else {
      renderAPIKeyForm();
    }
  });
});

const getPromptText = (input) => {
  return input.innerText;
};

const insertText = (text, target) => {
  target.innerText = text;
};

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

const executeScript = (tabId, func) =>
  new Promise((resolve) => {
    chrome.scripting.executeScript({ target: { tabId }, func }, resolve);
  });

const renderExtension = () => {
  const container = document.getElementById("container");
  const promptInput = document.getElementById("textarea");
  const askButton = document.getElementById("ask");
  const resultParagraph = document.getElementById("result");
  const logout = document.getElementById("logout");
  container.style.display = "flex";
  promptInput.focus();

  askButton.addEventListener("click", () => {
    getCurrentTab().then(async (tab) => {
      insertText("Loading your answer, give it a few seconds...", resultParagraph);
      const [{ result: pageText }] = await executeScript(tab.id, () => {
        if (window.getSelection) {
          return window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
          return document.selection.createRange().text;
        }
        return document.body.innerText
      });

      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `
          Based on the following information:
          ${pageText}
          Answer the following prompt: ${getPromptText(promptInput)}
          `,
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const GPTAnswer = data.choices[0].message.content;
          insertText(GPTAnswer, resultParagraph);
        })
        .catch((error) => {
          insertText("Something went wrong.", resultParagraph);
        });
    });
  });
  logout.addEventListener("click", () => {
    chrome.storage.local.set({ gpt_api_key: null }, function () {
      container.style.display = "none";
      renderAPIKeyForm();
    });
  });
};

const renderAPIKeyForm = () => {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const submitButton = document.getElementById("submit");
  const apiKeyContainer = document.getElementById("addAPIKey");
  apiKeyContainer.style.display = "flex";
  apiKeyInput.focus();

  submitButton.addEventListener("click", () => {
    chrome.storage.local.set({ gpt_api_key: apiKeyInput.value }, function () {
      apiKeyContainer.style.display = "none";
      renderExtension();
    });
  });
};

// getting text from the selected text
const port = chrome.runtime.connect({ name: "popup" });

port.onMessage.addListener((request) => {
  if (request.action === "selectedText") {
    processSelectedText(request.selectedText);
  }
});

port.postMessage({ action: "requestSelectedText" });

function processSelectedText(selectedText) {
  console.log("Selected text:", selectedText);
  // Process the selected text as needed
}