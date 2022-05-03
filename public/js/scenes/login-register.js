

sm.define("scene-login-register", $ => {
    if($.first_call) {
        var login_btn = $.scene.querySelector("#login_btn");
        var register_btn = $.scene.querySelector("#register_btn");
        login_btn.onclick = () => sm.switch($.scene.id, "scene-login");
        register_btn.onclick = () => sm.switch($.scene.id, "scene-register");
    }
});

