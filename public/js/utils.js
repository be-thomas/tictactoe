
/*
    Usage example -
        popup_show("Yo, How are you?", {"OK" : popup_hide});
*/
function popup_show(content, buttons=null) {
    let buttons_html = "";
    let cbs = [];
    if(buttons !== null) {
        Object.keys(buttons).forEach(text => {
            buttons_html += `
                <button id="popup_btn_${cbs.length}">${text}</button>
            `;
            cbs.push(buttons[text]);
        });
    }
    let btns = buttons !== null
        ?   `<div style="margin-top: 1em;">${buttons_html}</div>`
        :   ``;
    let popup_content = `
        <div class="flex-col flex-center">
            <div style="padding: 10px; font-size: 1em; font-family: Helvetica;">${content}</div>
            ${btns}
        </div>
    `;
    let popup = document.getElementById("popup");
    popup.innerHTML = popup_content;
    for(var i=0; i<cbs.length; i++) {
        document.getElementById(`popup_btn_${i}`).onclick = cbs[i];
    }
    let popup_container = document.getElementById("popup_container");
    popup_container.style.display = "flex";
}


function popup_hide() {
    let popup = document.getElementById("popup");
    let popup_container = document.getElementById("popup_container");
    popup.innerHTML = "";
    popup_container.style.display = "none";
}



function validate_username(username) {
    if(username.length < 3) {
        popup_show("Username should be atleast 3 characters long!", {"Ok" : popup_hide});
        return false;
    }
    if(username.length > 20) {
        popup_show("Username can be max 20 characters long!", {"Ok" : popup_hide});
        return false;
    }
    if(!/^[a-zA-Z0-9]+$/.test(username)) {
        popup_show("Invalid Username!<br>Only alphabets and numbers Allowed!", {"Ok": popup_hide});
        return false;
    }
    return true;
}

function validate_password(password) {
    if(password.length < 3) {
        popup_show("Password should be atleast 3 characters long!", {"Ok" : popup_hide});
        return false;
    }
    if(password.length > 20) {
        popup_show("Password can be max 20 characters long!", {"Ok" : popup_hide});
        return false;
    }
    return true;
}

function infinity_loader(caption) {
    return `
    <div class="flex-col flex-center">
        <div style="padding: 10px;">
            <img src="assets/infinity-loader.svg">
        </div>
        <div style="margin-top: 1.1em; font-size: 1em; font-family: Helvetica;">${caption}</div>
    </div>
    `;
}

