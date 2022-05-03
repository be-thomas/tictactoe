
var user_id = parseInt(window.localStorage.getItem("user_id"));
var token = window.localStorage.getItem("token");

if(user_id && token) {
    ticTacToe_user.login(user_id, token)
        .then(() => sm.switch(null, "scene-home", {user_id, token}))
        .catch(e => {
            console.log(e);
            sm.switch(null, "scene-login-register")
        });
} else {
    sm.switch(null, "scene-login-register");
}

// sm.switch(null, "scene-game");

ticTacToe_user.onClose(() => {
    popup_show("Lost Connection with server!, check your internet connection!",
        {
            "Ok": () => {
                window.location.reload();
            }
        });
});
