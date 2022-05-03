sm.define("scene-home", ($, msg) => {
    if($.first_call) {
        var start_btn = $.scene.querySelector("#start_btn");
        var players_btn = $.scene.querySelector("#players_btn");
        var logout_btn = $.scene.querySelector("#logout_btn");
        logout_btn.onclick = () => {
            window.localStorage.removeItem("user_id");
            window.localStorage.removeItem("token");
            sm.switch($.scene.id, "scene-login-register");
        }

        start_btn.onclick = () => {
            sm.switch($.scene.id, "scene-create-join", msg);
        }

        players_btn.onclick = () => {
            sm.switch($.scene.id, "scene-players", msg);
        }
    }
});
