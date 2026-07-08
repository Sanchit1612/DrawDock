const WEBSITE_URL = "https://draw-dock.vercel.app/";

document.getElementById("board").src = WEBSITE_URL;

document.getElementById("fullscreen").addEventListener("click", () => {

    chrome.tabs.create({
        url: WEBSITE_URL
    });

});