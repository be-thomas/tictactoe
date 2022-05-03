
sm.define("scene-create", ($, msg) => {

    let back_btn = $.scene.querySelector("#back_btn");
    let gameroom_id_view = $.scene.querySelector("#gameroom_id_view");
    let copy_btn = $.scene.querySelector("#copy_btn");
    let gameroom_id = msg.gameroom.gameroom_id;
    gameroom_id_view.innerHTML = gameroom_id;

    if(navigator.clipboard) {
        copy_btn.onclick = () => {
            navigator.clipboard.writeText(gameroom_id);
        };
    } else {
        copy_btn.style.display = "none";
    }
    
    back_btn.onclick = () => {
        popup_show("Are you sure, you want to Quit this GameRoom?",
            {
                "Yes" : () => {
                    popup_hide();
                    sm.switch($.scene.id, "scene-create-join", msg)
                },
                "No"  : popup_hide
            }
        );
    };

    msg.gameroom.onJoinRequest(player => {
        if(player.gameroom_id !== gameroom_id) { return; }
        popup_show(`Joining Request Received from <b>${player.username}</b>`,
            {
                "Reject": () => {
                    popup_hide();
                    player.reject()
                },
                "Accept": () => {
                    player.accept()
                        .then(gameroom => {
                            popup_hide();
                            sm.switch($.scene.id, "scene-game", msg);
                        })
                        .catch(e => {
                            popup_show(`Error!, could not accept the Join Request!
                                <br>Error Code: <b>${e}</b>`,
                                {"Close": popup_hide});
                        });
                }
            }
        );
    });
});

