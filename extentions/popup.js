const WEBSITE_URL = "http://localhost:5173?popup=true";

document.getElementById("board").src = WEBSITE_URL;

document.getElementById("fullscreen").addEventListener("click", () => {

    chrome.tabs.create({
        url: WEBSITE_URL
    });

});