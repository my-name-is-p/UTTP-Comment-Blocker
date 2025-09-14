const toggle = document.getElementById("enableToggle");
const silent = document.getElementById("silentToggle");

// Load current state from storage
chrome.storage.sync.get({ enabled: true }, (data) => {
    toggle.checked = data.enabled;
});

// Save new state when user toggles
toggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
    uttpBlockerSendUpdate();
});

silent.addEventListener("change", () => {
    chrome.storage.sync.set({ silent: silent.checked });
    uttpBlockerSendUpdate();
});

function uttpBlockerSendUpdate(){
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "settingsUpdated" });
        }
    });
}