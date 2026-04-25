let text_decoration = true; 

function matchRuleShort(str, rule) {
    const escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

function onError(error) {
    console.error(`Error: ${error}`);
}

class Custom_option {
    constructor(url, background, color, shadowActivated, shadowColor, shadowBlur, decorationActivated, decorationType, decorationColor) {
        this.url = url;
        this.color = color;
        this.background = background;
        this.shadowActivated = shadowActivated;
        this.shadowColor = shadowColor;
        this.shadowBlur = shadowBlur;
        this.decorationActivated = decorationActivated;
        this.decorationType = decorationType;
        this.decorationColor = decorationColor;
    }
}

async function addCustom() {
    try {
        const result = await chrome.storage.local.get();
        const custom_url = document.querySelector("#add_url").value; 
        document.querySelector("#add_url").value = "";
        
        const customSettings = new Custom_option(
            custom_url, 
            document.querySelector("#background_color").value || "#007EF3", 
            document.querySelector("#color").value || "white", 
            document.querySelector("input#activate_textShadow").checked || false, 
            document.querySelector("#shadow-color").value || "none", 
            document.querySelector("#shadow-blur").value || "0", 
            document.querySelector("input#activate_textDecoration").checked || false, 
            document.querySelector("#decoration_select").value || "none", 
            document.querySelector("#decoration-color").value || "#007EF3FF"
        ); 
        
        const customs = result.customOptions || []; 
        customs.push(customSettings); 
        await chrome.storage.local.set({ customOptions: customs });
        
        const optionToAdd = document.createElement("option"); 
        optionToAdd.textContent = custom_url; 
        optionToAdd.value = custom_url; 
        
        const select = document.querySelector("#custom_select");
        select.appendChild(optionToAdd); 
        select.value = custom_url;
        select.dispatchEvent(new Event('change'));
        
        chrome.runtime.sendMessage({ request: "update-action-icon" });
    } catch (error) {
        onError(error);
    }
}

async function removeCustom() {
    try {
        const result = await chrome.storage.local.get();
        const selectIndex = document.querySelector("#custom_select").selectedIndex - 1; 
        const customs = result.customOptions; 
        
        customs.splice(selectIndex, 1); 
        await chrome.storage.local.set({ customOptions: customs });
        
        const customSettingsSelect = document.querySelector("#custom_select"); 
        customSettingsSelect.remove(document.querySelector("#custom_select").selectedIndex); 
        
        document.querySelector("#url_div").style.display = "none"; 
        document.querySelector("#remove_custom").style.display = "none"; 
        
        // Restore default settings
        document.querySelector("#background_color").jscolor.fromString(result.background_color || "#007EF3");
        document.querySelector("#color").jscolor.fromString(result.color || "white");
        document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#ffffff");
        document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
        document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
        document.querySelector("input#activate_textDecoration").checked = result.decorationActivated;
        document.querySelector("#decoration_select").value = result.decorationType;
        document.querySelector("#decoration-color").jscolor.fromString(result.decorationColor || "#007EF3FF");
        
        document.querySelector('div#textShadowOptions').style.display = result.shadowActivated ? "flex" : "none";
        document.querySelector('div#textDecorationOptions').style.display = result.decorationActivated ? "flex" : "none";
        
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs.length > 0) {
            const activeTabURL = new URL(tabs[0].url);
            document.querySelector("#add_url").value = activeTabURL.host;
        }
        
        updatePreview(); 
        chrome.runtime.sendMessage({ request: "inject-css-all" });
        chrome.runtime.sendMessage({ request: "update-action-icon" });
    } catch (error) {
        onError(error);
    }
}

async function saveOptions(e) { 
    e.preventDefault();
    const selectIndex = document.querySelector("#custom_select").selectedIndex; 
    
    try {
        if(selectIndex === 0) { 
            await chrome.storage.local.set({ 
                background_color: document.querySelector("#background_color").value || "#007EF3",
                color: document.querySelector("#color").value || "white",
                shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
                shadowColor: document.querySelector("#shadow-color").value || "none",
                shadowBlur: document.querySelector("#shadow-blur").value || "0",
                decorationActivated: document.querySelector("input#activate_textDecoration").checked || false,
                decorationType: document.querySelector("#decoration_select").value || "none",
                decorationColor: document.querySelector("#decoration-color").value || "none",
                witness: true
            });
        } else {
            const result = await chrome.storage.local.get();
            const customs = result.customOptions; 
            const indexToUpdate = selectIndex - 1;
            
            customs[indexToUpdate] = { 
                background: document.querySelector("#background_color").value || "#007EF3",
                color: document.querySelector("#color").value || "white",
                shadowActivated: document.querySelector("input#activate_textShadow").checked || false,
                shadowColor: document.querySelector("#shadow-color").value || "none",
                shadowBlur: document.querySelector("#shadow-blur").value || "0",
                decorationActivated: document.querySelector("input#activate_textDecoration").checked || false,
                decorationType: document.querySelector("#decoration_select").value || "none",
                decorationColor: document.querySelector("#decoration-color").value || "none",
                url: document.querySelector("#change_url").value
            };
            
            await chrome.storage.local.set({ customOptions: customs });
            
            const select = document.querySelector("#custom_select");
            select.options[select.selectedIndex].textContent = document.querySelector("#change_url").value;
            select.options[select.selectedIndex].value = document.querySelector("#change_url").value;
        }
        
        chrome.runtime.sendMessage({ request: "inject-css-all" });
    } catch (error) {
        onError(error);
    }
}

function updatePreview() { 
    const preview = document.querySelector("#preview");
    preview.style.background = document.querySelector("#background_color").value;
    preview.style.color = document.querySelector("#color").value;
    
    if (document.querySelector("input#activate_textShadow").checked) {
        preview.style.textShadow = `${document.querySelector("#shadow-color").value} 0px 0px ${document.querySelector("#shadow-blur").value}px`;
    } else {
        preview.style.textShadow = "";
    }
    
    if (document.querySelector("input#activate_textDecoration").checked) {
        preview.style.textDecoration = `${document.querySelector("#decoration_select").value} ${document.querySelector("#decoration-color").value}`;
    } else {
        preview.style.textDecoration = "";
    }
}

async function restoreOptions() {
    try {
        const result = await chrome.storage.local.get(); 
        if (result.customOptions) { 
            result.customOptions.forEach(element => { 
                const option = document.createElement("option");
                option.textContent = element.url;
                option.value = element.url;
                document.querySelector("#custom_select").appendChild(option);
            });
        }
        
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs.length > 0) {
            const activeTabURL = new URL(tabs[0].url);
            let isOnCustom = false;
            
            if (result.customOptions) { 
                result.customOptions.forEach((element) => {
                    if (matchRuleShort(activeTabURL.host, element.url)) { 
                        const select = document.querySelector("#custom_select");
                        select.value = element.url;
                        select.dispatchEvent(new Event('change'));
                        isOnCustom = true;
                    }
                });
            }
            
            if (!isOnCustom) {
                document.querySelector("#add_url").value = activeTabURL.host;
                document.querySelector("#custom_select").dispatchEvent(new Event('change'));
            }
        }
        
        if (!text_decoration) {
            document.querySelector("#formdivtxtdec").style.display = "none";
        }
    } catch (error) {
        onError(error);
    }
}

function updateShadowColorDisplay() {
    document.querySelector('div#textShadowOptions').style.display = document.querySelector("input#activate_textShadow").checked ? "flex" : "none";
}

function updateDecorationDisplay() {
    document.querySelector('div#textDecorationOptions').style.display = document.querySelector("input#activate_textDecoration").checked ? "flex" : "none";
}

async function changeCustomDisplay(event) { 
    const selectIndex = document.querySelector("#custom_select").selectedIndex;
    
    try {
        const result = await chrome.storage.local.get(); 
        
        if(selectIndex !== 0) { 
            const customUrl = document.querySelector("#custom_select").value;
            document.querySelector("#change_url").value = customUrl; 
            document.querySelector("#change_url").placeholder = customUrl;
            document.querySelector("#url_div").style.display = "block"; 
            document.querySelector("#remove_custom").style.display = "block"; 
            
            const customs = result.customOptions; 
            const currentCustom = customs[selectIndex - 1];
            
            document.querySelector("#background_color").jscolor.fromString(currentCustom.background || "#007EF3");
            document.querySelector("#color").jscolor.fromString(currentCustom.color || "white");
            document.querySelector("#shadow-color").jscolor.fromString(currentCustom.shadowColor || "#ffffff");
            document.querySelector("#shadow-blur").value = currentCustom.shadowBlur || "0px";
            document.querySelector("input#activate_textShadow").checked = currentCustom.shadowActivated;
            document.querySelector("input#activate_textDecoration").checked = currentCustom.decorationActivated;
            document.querySelector("#decoration_select").value = currentCustom.decorationType;
            document.querySelector("#decoration-color").jscolor.fromString(currentCustom.decorationColor || "#007EF3FF");
            
            document.querySelector('div#textShadowOptions').style.display = currentCustom.shadowActivated ? "flex" : "none";
            document.querySelector('div#textDecorationOptions').style.display = currentCustom.decorationActivated ? "flex" : "none";
            
        } else {
            document.querySelector("#url_div").style.display = "none"; 
            document.querySelector("#remove_custom").style.display = "none"; 
            
            document.querySelector("#background_color").jscolor.fromString(result.background_color || "#007EF3");
            document.querySelector("#color").jscolor.fromString(result.color || "white");
            document.querySelector("#shadow-color").jscolor.fromString(result.shadowColor || "#ffffff");
            document.querySelector("#shadow-blur").value = result.shadowBlur || "0px";
            document.querySelector("input#activate_textShadow").checked = result.shadowActivated;
            document.querySelector("input#activate_textDecoration").checked = result.decorationActivated;
            document.querySelector("#decoration_select").value = result.decorationType;
            document.querySelector("#decoration-color").jscolor.fromString(result.decorationColor || "#007EF3FF");
            
            document.querySelector('div#textShadowOptions').style.display = result.shadowActivated ? "flex" : "none";
            document.querySelector('div#textDecorationOptions').style.display = result.decorationActivated ? "flex" : "none";
        }
        updatePreview(); 
    } catch (error) {
        onError(error);
    }
}

function localizeHtmlPage() {
    const objects = document.getElementsByTagName('html');
    for (let j = 0; j < objects.length; j++) {
        const obj = objects[j];
        const valStrH = obj.innerHTML.toString();
        const valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if(valNewH !== valStrH) {
            obj.innerHTML = valNewH;
        }
    }
}

function checkURLHost(event) {
    const inp = event.target;
    // FIXED REGEX: Using a literal prevents escape characters from being swallowed by string parsing
    const regex = /^(([a-zA-Z*]|[a-zA-Z*][a-zA-Z0-9\-*]*[a-zA-Z0-9*])\.)*([A-Za-z*]|[A-Za-z*][A-Za-z0-9\-*]*[A-Za-z0-9*])$/;
    
    if (regex.test(inp.value)) {
        inp.setCustomValidity("");
    } else {
        inp.setCustomValidity("Please enter a valid hostname pattern");
    }
}

localizeHtmlPage();

// Set event listeners
document.addEventListener("DOMContentLoaded", restoreOptions);
document.addEventListener("DOMContentLoaded", () => { let myPicker = new JSColor('#shadow-color', {'position': 'top'}) });
document.addEventListener("DOMContentLoaded", () => { setTimeout(updatePreview, 100) });
document.querySelector("#save_btn").addEventListener("click", saveOptions);
document.querySelector("#formdiv").addEventListener("keyup", updatePreview);
document.querySelector("#formdiv").addEventListener("input", updatePreview);
document.querySelector("#add_url").addEventListener("input", checkURLHost);
document.querySelector("#change_url").addEventListener("input", checkURLHost);
document.querySelector("#add_custom").addEventListener("click", addCustom);
document.querySelector("#remove_custom").addEventListener("click", removeCustom);
document.querySelector("input#activate_textShadow").addEventListener("change", updatePreview);
document.querySelector("select#custom_select").addEventListener("change", changeCustomDisplay);
document.querySelector("input#activate_textShadow").addEventListener("change", updateShadowColorDisplay);
document.querySelector("input#activate_textDecoration").addEventListener("change", updateDecorationDisplay);

document.addEventListener("paste", (e) => {
    const t = e.target;
    const isEditable = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t && t.isContentEditable);
    
    if (!isEditable) {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return; 

        const clipboardText = clipboardData.getData("text") || "";
        
        try {
            const json = JSON.parse(clipboardText);
            if (json) {
                if (json.color) {
                    document.querySelector("#color").jscolor.fromString("FFFFFFFF");
                    document.querySelector("#color").jscolor.fromString(json.color);
                }
                if (json.background_color) {
                    document.querySelector("#background_color").jscolor.fromString("FFFFFFFF");
                    document.querySelector("#background_color").jscolor.fromString(json.background_color);
                }
                if (json.shadowActivated !== undefined) {
                    document.querySelector("input#activate_textShadow").checked = json.shadowActivated;
                    document.querySelector('div#textShadowOptions').style.display = json.shadowActivated ? "flex" : "none";
                }
                if (json.shadowColor) {
                    document.querySelector("#shadow-color").jscolor.fromString("FFFFFFFF");
                    document.querySelector("#shadow-color").jscolor.fromString(json.shadowColor);
                }
                if (json.shadowBlur) {
                    document.querySelector("#shadow-blur").value = json.shadowBlur;
                }
                if (json.decorationActivated !== undefined) {
                    document.querySelector("input#activate_textDecoration").checked = json.decorationActivated;
                    document.querySelector('div#textDecorationOptions').style.display = json.decorationActivated ? "flex" : "none";
                }
                if (json.decorationType) {
                    document.querySelector("#decoration_select").value = json.decorationType;
                }
                if (json.decorationColor) {
                    document.querySelector("#decoration-color").jscolor.fromString("FFFFFFFF");
                    document.querySelector("#decoration-color").jscolor.fromString(json.decorationColor);
                }
                updatePreview();
            }
        } catch (err) {
            // Silently fail if not valid JSON
        }
    }
});