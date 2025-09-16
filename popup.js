const toggle = document.getElementById("enableToggle");
const silent = document.getElementById("silentToggle");
const addUserBtn = document.getElementById("userBlacklistAdd");
const addUserMessage = document.getElementById("addUserMsg");
const userInput = document.getElementById("userBlacklistInput");

// Load current state from storage
chrome.storage.sync.get({ enabled: true, silent: false }, (data) => {
    toggle.checked = data.enabled;
    silent.checked = data.silent;
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

userInput.onkeydown = (event) => {
    if(event.key === 'Enter') {
        uttpAddToUserBlacklist();
    }
};

addUserBtn.addEventListener("click", uttpAddToUserBlacklist);

function uttpAddToUserBlacklist(){
    chrome.storage.sync.get({ blockedUsers: ["@UTTP*"] }, (data) => {
        let user = userInput.value;
        const blockedUsers = data.blockedUsers;
        if(user.trim() != ""){
            user = user.charAt(0) != "@" ? "@" + user : user;
            if(blockedUsers.includes(user)){
                uttpShowAddMessage(addUserMessage, user + " already blacklisted");
            } else {
                blockedUsers.push(user);
                chrome.storage.sync.set({ blockedUsers: blockedUsers });
                uttpShowAddMessage(addUserMessage, user + " added to blacklist");
                uttpUpdateUserBlacklist();
            }
        }
        userInput.value = "";
    });
}

function uttpBlockerSendUpdate(){
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "settingsUpdated" });
        }
    });
}

function uttpShowAddMessage(msgBox, msgText){
    msgBox.innerText = msgText;
    msgBox.classList.add('bl-add-message-show');
    setTimeout(() => {
        msgBox.classList.remove('bl-add-message-show');
    }, 1000);
}

function uttpUpdateUserBlacklist(){
    chrome.storage.sync.get({ blockedUsers: ["QUTTP"] }, (data) => {
        const blockedUsers = data.blockedUsers;
        const userList = document.getElementById("userBlacklistList");
        userList.innerHTML = "";
        blockedUsers.forEach((user) => {
            const listItem = uttpCreateListItem(user);
            userList.append(listItem);
        });
        uttpBlockerSendUpdate();
    });
}

function uttpCreateListItem(user){
    const text = document.createElement("span");
    text.className = "bl-li-text";
    text.innerText = user;

    const remove = document.createElement("span");
    remove.className = "bl-li-remove";
    remove.innerText = '\u{2A09}';
    remove.addEventListener("click", () => {
        chrome.storage.sync.get({ blockedUsers: ["@UTTP*"] }, (data) => {
            const blockedUsers = data.blockedUsers;
            const index = blockedUsers.indexOf(user)
            if(index >= 0){
                blockedUsers.splice(index, 1);
                chrome.storage.sync.set({ blockedUsers: blockedUsers });
                uttpShowAddMessage(addUserMessage, user + " removed from blacklist")
                uttpUpdateUserBlacklist();
            }
        });
    });

    const li = document.createElement("li");
    li.className = "bl-li";
    li.append(text);
    li.append(remove);

    return li;
}

function uttpPopupInit(){
    console.log('popup opened');
    uttpUpdateUserBlacklist();
}

document.addEventListener("DOMContentLoaded", uttpPopupInit);