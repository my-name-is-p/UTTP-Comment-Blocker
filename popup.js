const toggle = document.getElementById("enableToggle");
const silent = document.getElementById("silentToggle");
const addUserBtn = document.getElementById("userBlacklistAdd");
const addUserMessage = document.getElementById("addUserMsg");
const userInput = document.getElementById("userBlacklistInput");
const addWordBtn = document.getElementById("wordBlacklistAdd");
const addWordMessage = document.getElementById("addWordMsg");
const wordInput = document.getElementById("wordBlacklistInput");

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

wordInput.onkeydown = (event) => {
    if(event.key === 'Enter') {
        uttpAddToWordBlacklist();
    }
};

addWordBtn.addEventListener("click", uttpAddToWordBlacklist);

function uttpAddToUserBlacklist(){
    chrome.storage.sync.get({ blockedUsers: ["@UTTP*"] }, (data) => {
        let user = userInput.value;
        const blockedUsers = data.blockedUsers;
        if(user.trim() != ""){
            user = user.charAt(0) != "@" ? "@" + user : user;
            if(blockedUsers.includes(user)){
                uttpShowAddMessage(addUserMessage, user + " already exists");
            } else {
                blockedUsers.push(user);
                chrome.storage.sync.set({ blockedUsers: blockedUsers });
                uttpShowAddMessage(addUserMessage, user + " added");
                uttpUpdateUserBlacklist();
            }
        }
        userInput.value = "";
    });
}

function uttpUpdateUserBlacklist(){
    chrome.storage.sync.get({ blockedUsers: ["QUTTP"] }, (data) => {
        const blockedUsers = data.blockedUsers.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const userList = document.getElementById("userBlacklistList");
        userList.innerHTML = "";
        blockedUsers.forEach((user) => {
            const listItem = uttpCreateListItem(user, addUserMessage);
            userList.append(listItem);
        });
        uttpBlockerSendUpdate();
    });
}

function uttpAddToWordBlacklist(){
    chrome.storage.sync.get({ blockedWords: [] }, (data) => {
        let word = wordInput.value;
        const blockedWords = data.blockedWords;
        if(word.trim() != ""){
            if(blockedWords.includes(word)){
                uttpShowAddMessage(addWordMessage, word + " already exists");
            } else {
                blockedWords.push(word);
                chrome.storage.sync.set({ blockedWords: blockedWords });
                uttpShowAddMessage(addWordMessage, word + " added");
                uttpUpdateWordBlacklist();
            }
        }
        wordInput.value = "";
    });
}

function uttpUpdateWordBlacklist(){
    chrome.storage.sync.get({ blockedWords: [] }, (data) => {
        const blockedWords = data.blockedWords.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const wordList = document.getElementById("wordBlacklistList");
        wordList.innerHTML = "";
        blockedWords.forEach((word) => {
            const listItem = uttpCreateListItem(word, addWordMessage);
            console.log(listItem);
            wordList.append(listItem);
        });
        uttpBlockerSendUpdate();
    });
}

function uttpShowAddMessage(msgBox, msgText){
    msgBox.innerText = msgText;
    msgBox.classList.add('bl-add-message-show');
    setTimeout(() => {
        msgBox.classList.remove('bl-add-message-show');
    }, 1000);
}

function uttpCreateListItem(itemText, msgBox){
    const text = document.createElement("span");
    text.className = "bl-li-text";
    text.innerText = itemText;

    const remove = document.createElement("span");
    remove.className = "bl-li-remove";
    remove.innerText = '\u{2A09}';
    remove.addEventListener("click", () => {
        if(msgBox == addUserMessage){
            chrome.storage.sync.get({ blockedUsers: ["@UTTP*"] }, (data) => {
                const blockedUsers = data.blockedUsers;
                const index = blockedUsers.indexOf(itemText)
                if(index >= 0){
                    blockedUsers.splice(index, 1);
                    chrome.storage.sync.set({ blockedUsers: blockedUsers });
                    uttpShowAddMessage(msgBox, itemText + " removed")
                    uttpUpdateUserBlacklist();
                }
            });
        } else if(msgBox == addWordMessage) {
            chrome.storage.sync.get({ blockedWords: [] }, (data) => {
                const blockedWords = data.blockedWords;
                const index = blockedWords.indexOf(itemText)
                if(index >= 0){
                    blockedWords.splice(index, 1);
                    chrome.storage.sync.set({ blockedWords: blockedWords });
                    uttpShowAddMessage(msgBox, itemText + " removed")
                    uttpUpdateWordBlacklist();
                }
            });
        }
    });

    const li = document.createElement("li");
    li.className = "bl-li";
    li.append(text);
    li.append(remove);

    return li;
}

function uttpBlockerSendUpdate() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { type: "settingsUpdated" },
                () => {
                    if (chrome.runtime.lastError) {
                        console.warn("No listener in active tab:", chrome.runtime.lastError.message);
                    }
                }
            );
        }
    });
}

function uttpPopupInit(){
    uttpUpdateUserBlacklist();
    uttpUpdateWordBlacklist();
}

document.addEventListener("DOMContentLoaded", uttpPopupInit);