const body = document.body;
const styles = window.getComputedStyle(body);
const backgroundColor = styles.getPropertyValue('--yt-spec-inverted-background') + 'cc';

function processComment(commentEl) {
    chrome.storage.sync.get( {enabled: true, silent: false, blockedUsers: ["@UTTP*"], blockedWords: []}, (data) => {
        const author = commentEl.querySelector("#author-text span");
        const content = commentEl.querySelector("#content-text");

        const oldPlaceholder = commentEl.querySelector(".ut-blocker-placeholder");
        if (oldPlaceholder) oldPlaceholder.remove();
        
        if (!data.enabled){
            if (!author || !content) return;

            uttpBlockerShowComment(commentEl);
            return;
        }

        if (!author || !content) return;

        uttpBlockerShowComment(commentEl);

        const authorText = author.innerText;
        const contentText = content.innerText;

        const blockedUsers = data.blockedUsers;
        const userBlocked = uttpUserCheck(authorText, blockedUsers);

        const blockedWords = data.blockedWords;
        const wordBlocked = uttpWordCheck(contentText, blockedWords);

        if (userBlocked || wordBlocked) {
            uttpBlockerRemoveComment(commentEl, authorText, data.silent);
        }
    });
}

function uttpBlockerRemoveComment(commentEl, author, silent){
    commentEl.setAttribute('uttp-blocker-comment-hidden', 'true')

    // Create placeholder box
    const placeholder = uttpBlockCreatePlaceholder(author);

    // Add toggle link
    const toggleLink = uttpBlockCreateToggle();

    toggleLink.addEventListener("click", (e) => {
        e.preventDefault();
        const commentHidden = commentEl.getAttribute('uttp-blocker-comment-hidden')?.toLowerCase() === "true";
        if (commentHidden) {
            uttpBlockerShowComment(commentEl);
            commentEl.setAttribute('uttp-blocker-comment-hidden', 'false');
            toggleLink.innerText = " (Hide)";
        } else {
            uttpBlockerHideComment(commentEl);
            commentEl.setAttribute('uttp-blocker-comment-hidden', 'true');
            toggleLink.innerText = " (Show)";
        }
    });

    placeholder.appendChild(toggleLink);

    // Hide comment content initially
    uttpBlockerHideComment(commentEl);
    if(!silent){
        commentEl.style.flexWrap = 'wrap';
        commentEl.prepend(placeholder);
    }
}

function uttpUserCheck(user, blockedUsers){
    const blockedUsersFull = blockedUsers;
    const blockedUsersPartial = blockedUsers.filter(str => str.includes('*'));
    let blocked = false;

    if(blockedUsersFull.includes(user)){
        blocked = true;
    }

    blockedUsersPartial.forEach((blockedUser) => {
        testName = blockedUser.slice(0, -1);
        if(user.includes(testName)){
            blocked = true;
        }
    });

    return blocked;
}

function uttpWordCheck(word, blockedWords){
    const blockedWordsFull = blockedWords;
    let blocked = false;

    blockedWordsFull.forEach((blockedWord) => {
        word = word.toLowerCase();
        blockedWord = blockedWord.toLowerCase();
        if(word.includes(blockedWord)){
            blocked = true;
        }
    });

    return blocked;
}

function uttpBlockerShowComment(commentEl){
    const authorThumb = commentEl.querySelector("#author-thumbnail");
    const commentMain = commentEl.querySelector("#main");
    const actionMenu = commentEl.querySelector("#action-menu");

    if (commentMain) commentMain.style.display = "";
    if (actionMenu) actionMenu.style.display = "";
    if (authorThumb) authorThumb.style.display = "";
}

function uttpBlockerHideComment(commentEl){
    const authorThumb = commentEl.querySelector("#author-thumbnail");
    const commentMain = commentEl.querySelector("#main");
    const actionMenu = commentEl.querySelector("#action-menu");

    if (commentMain) commentMain.style.display = "none";
    if (actionMenu) actionMenu.style.display = "none";
    if (authorThumb) authorThumb.style.display = "none";
}

function uttpBlockCreatePlaceholder(authorName){
    const placeholder = document.createElement("div");
    placeholder.className = "ut-blocker-placeholder";
    placeholder.innerText = "Comment from " + authorName;
    placeholder.style.background = backgroundColor;
    placeholder.style.minHeight
    placeholder.style.borderRadius = "4px";
    placeholder.style.padding = "6px 8px";
    placeholder.style.margin = "4px 0";
    placeholder.style.fontSize = "12px";
    placeholder.style.color = "var(--yt-spec-text-primary-inverse)";
    placeholder.style.fontStyle = "italic";
    placeholder.style.fontWeight = "bold";
    placeholder.style.flexGrow = '1'; // Allows the item to grow
    placeholder.style.flexShrink = '0'; // Prevents the item from shrinking
    placeholder.style.flexBasis = '100%'; // Sets the initial size
    placeholder.className = "ut-blocker-placeholder";

    return placeholder;
}

function uttpBlockCreateToggle(){
    const toggleLink = document.createElement("a");
    toggleLink.href = "#";
    toggleLink.innerText = " (Show)";
    toggleLink.style.color = "#065fd4"; // YouTube blue
    toggleLink.style.cursor = "pointer";
    toggleLink.style.textDecoration = "none";

    return toggleLink;
}

// MutationObserver to catch dynamically loaded comments
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                if (node.classList.contains("ytd-comment-view-model")) {
                    processComment(node);
                } 
            }
        });
    }
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "settingsUpdated") {
        // Re-process all comments
        document.querySelectorAll(".ytd-comment-view-model:not(#main)").forEach(processComment);
    }
});
