
sm.define("scene-create-join", ($, msg) => {
    let back_btn = $.scene.querySelector("#back_btn");
    let create_btn = $.scene.querySelector("#create_btn");
    let join_btn = $.scene.querySelector("#join_btn");
    let loading = false;

    const show_loader = caption => {
        loading = true;
        popup_show(infinity_loader(caption));
    };

    const hide_loader = () => {
        popup_hide();
        loading = false;
    };

    back_btn.onclick = () => {
        if(loading) { return; }
        sm.switch($.scene.id, "scene-home", msg);
    };

    create_btn.onclick = () => {
        if(loading) { return; }
        ticTacToe_user.create_GameRoom()
            .then(gameroom => {
                hide_loader();
                let new_msg = {...msg, gameroom};
                sm.switch($.scene.id, "scene-create", new_msg);
            })
            .catch(e => {
                hide_loader();
                console.log(e);
                popup_show("Error Ocurred, while creating GameRoom!",
                    {
                        "Ok": popup_hide
                    }
                );
            });
        show_loader("Creating GameRoom");
    };

    join_btn.onclick = () => {
        if(loading) { return; }
        sm.switch($.scene.id, "scene-join", msg);
    };
});

