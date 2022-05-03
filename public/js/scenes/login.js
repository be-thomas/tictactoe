

sm.define("scene-login", $ => {
    if($.first_call) {
        let back_btn = $.scene.querySelector("#back_btn");
        let login_btn = $.scene.querySelector("#login_btn");

        back_btn.onclick = () => sm.switch($.scene.id, "scene-login-register");
        login_btn.onclick = () => {

            let username = $.scene.querySelector("#username_txt").value;
            let password = $.scene.querySelector("#password_txt").value;
            if(!(validate_username(username)
                && validate_password(password))) {
                return;
            }

            ticTacToe_user.login(username, password)
                .then(resp => {
                    console.log(resp);
                    window.localStorage.setItem("user_id", parseInt(resp.user_id));
                    window.localStorage.setItem("token", resp.token);
                    let msg = {user_id: resp.user_id, token: resp.token};
                    sm.switch($.scene.id, "scene-home", msg);
                })
                .catch(err => popup_show("Wrong Username or Password!<br>Try Again!", {"Ok": popup_hide}));
        }
    }
});

