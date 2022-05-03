

sm.define("scene-register", $ => {
    if($.first_call) {
        var back_btn = $.scene.querySelector("#back_btn");
        var register_btn = $.scene.querySelector("#register_btn");
        back_btn.onclick = () => sm.switch($.scene.id, "scene-login-register");
        register_btn.onclick = () => {

            let username = $.scene.querySelector("#username_txt").value;
            let password = $.scene.querySelector("#password_txt").value;
            if(!(validate_username(username)
                && validate_password(password))) {
                return;
            }

            ticTacToe_user.register(username, password)
                .then(resp => {
                    console.log(resp);
                    window.localStorage.setItem("user_id", parseInt(resp.user_id));
                    window.localStorage.setItem("token", resp.token);
                    let msg = { user_id: resp.user_id, token: resp.token };
                    sm.switch($.scene.id, "scene-home", msg);
                })
                .catch(err => popup_show("Username Taken!<br>Try Another One", {"Ok": popup_hide}))
        }
    }
});

