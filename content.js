const body = document.body;
const styles = window.getComputedStyle(body);
const backgroundColor = styles.getPropertyValue('--yt-spec-inverted-background') + 'cc';

function processComment(commentEl) {
    chrome.storage.sync.get( {enabled: true, silent: false}, (data) => {
        const author = commentEl.querySelector("#author-text span");
        const content = commentEl.querySelector("#content-text");

        const oldPlaceholder = commentEl.querySelector(".ut-blocker-placeholder");
        if (oldPlaceholder) oldPlaceholder.remove();
        
        if (!data.enabled){
            if (!author || !content) return;

            uttpBlockShowComment(commentEl);
            return;
        }

        if (!author || !content) return;

        if (author.innerText.includes("UTTP")) {            
            commentEl.setAttribute('uttp-blocker-comment-hidden', 'true')

            // Create placeholder box
            const placeholder = uttpBlockCreatePlaceholder(author.innerText);

            // Add toggle link
            const toggleLink = uttpBlockCreateToggle();

            toggleLink.addEventListener("click", (e) => {
                e.preventDefault();
                const commentHidden = commentEl.getAttribute('uttp-blocker-comment-hidden')?.toLowerCase() === "true";
                if (commentHidden) {
                    uttpBlockShowComment(commentEl);
                    commentEl.setAttribute('uttp-blocker-comment-hidden', 'false');
                    toggleLink.innerText = " (Hide)";
                } else {
                    uttpBlockHideComment(commentEl);
                    commentEl.setAttribute('uttp-blocker-comment-hidden', 'true');
                    toggleLink.innerText = " (Show)";
                }
            });

            placeholder.appendChild(toggleLink);

            // Hide comment content initially
            uttpBlockHideComment(commentEl);
            if(!data.silent){
                console.log('test');
                commentEl.style.flexWrap = 'wrap';
                commentEl.prepend(placeholder);
            }
        }
    });
}

function uttpBlockShowComment(commentEl){
    const authorThumb = commentEl.querySelector("#author-thumbnail");
    const commentMain = commentEl.querySelector("#main");
    const actionMenu = commentEl.querySelector("#action-menu");

    if (commentMain) commentMain.style.display = "";
    if (actionMenu) actionMenu.style.display = "";
    if (authorThumb) authorThumb.style.display = "";
}

function uttpBlockHideComment(commentEl){
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
    placeholder.innerText = "Comment from " + authorName + " hidden by UTTP Blocker";
    placeholder.style.background = backgroundColor;
    placeholder.style.borderRadius = "4px";
    placeholder.style.padding = "6px 8px";
    placeholder.style.margin = "4px 0";
    placeholder.style.fontSize = "0.9em";
    placeholder.style.color = "var(--yt-spec-text-primary-inverse)";
    placeholder.style.fontStyle = "italic";
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
                } else {
                    node.querySelectorAll?.("ytd-comment-view-model").forEach(processComment);
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
