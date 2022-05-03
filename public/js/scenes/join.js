
sm.define("scene-join", ($, msg) => {
    let back_btn = $.scene.querySelector("#back_btn");
    let gameroom_id_txt = $.scene.querySelector("#gameroom_id_txt");
    let paste_btn = $.scene.querySelector("#paste_btn");
    let join_btn = $.scene.querySelector("#join_btn");
    let loading = false;

    const show_loader = (caption, buttons=null) => {
        loading = true;
        popup_show(infinity_loader(caption), buttons);
    };

    const hide_loader = () => {
        popup_hide();
        loading = false;
    };

    back_btn.onclick = () => {
        if(loading) { return; }
        sm.switch($.scene.id, "scene-create-join");
    };

    if(navigator.clipboard) {
        paste_btn.onclick = () => {
            if(loading) { return; }
            navigator.clipboard.readText()
                .then(val => {
                    gameroom_id_txt.value = val
                })
                .catch(e => paste_btn.style.display = "none");
        };
    } else {
        paste_btn.style.display = "none";
    }

    join_btn.onclick = () => {
        if(loading) { return; }

        let gameroom_id = parseInt(gameroom_id_txt.value);
        if(isNaN(gameroom_id)) {
            return popup_show("Invalid GameRoom ID !", { "Ok" : popup_hide });
        }
        gameroom = ticTacToe_user.join_GameRoom(gameroom_id);
        gameroom.onJoinAccepted(gameroom => {
            let new_msg = {...msg, gameroom};
            hide_loader();
            sm.switch($.scene.id, "scene-game", new_msg);
            popup_show("Join Request was Accepted!",
                {"Ok": () => {
                    popup_hide();
                }});
        });
        gameroom.onJoinRejected(() => {
            hide_loader();
            popup_show("Join Request was Rejected!",
                {"Ok": popup_hide});
        });

        show_loader("Join Request Sent, Waiting for Response",
            {"Cancel": hide_loader});
    };
});
