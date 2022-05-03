

sm.define("scene-game", ($, msg) => {
    let back_btn = $.scene.querySelector("#back_btn");
    let msg_view = $.scene.querySelector("#msg_view");
    let gameboard = $.scene.querySelector("#gameboard");
    let player_info = $.scene.querySelector("#player_info");
    let gameroom = msg.gameroom;
    let closed = false;

    console.log(msg);
    let player_no, player_symbol;
    if(msg.user_id === gameroom.data.user1_id) {
        player_no = 1; player_symbol = "X";
    } else if(msg.user_id === gameroom.data.user2_id) {
        player_no = 2; player_symbol = "O";
    }

    let other_player_no = player_no === 1 ? 2 : 1;
    let other_player_symbol = player_symbol === "X" ? "O" : "X";

    player_info.innerHTML = `You are Player #${player_no} (${player_symbol})`;
    msg_view.innerHTML = "";
    let my_turn = false;

    let update_gameboard = () => {
        let gameboard = gameroom.data.gameboard;
        for(var i=0; i<gameboard.length; i++) {
            $.scene.querySelector(`#gameboard_${i+1}`).innerHTML = gameboard[i];
        }
    }

    for(var i=1; i<=9; i++) {
        $.scene.querySelector(`#gameboard_${i}`).onclick = function() {
            if(!my_turn) { return; }
            let id = parseInt(this.id.replace("gameboard_", ""));
            console.log("clicked - ", id);
            if(my_turn) {
                gameroom.play(id)
                    .then(_ => update_gameboard())
                    .catch(e => {
                        popup_show("Error occured when updating gameboard!",
                            {"Ok": popup_hide});
                    });
                my_turn = false;
            }
        }
    }

    gameroom.onMyTurn(() => {
        console.log("MyTurn");
        my_turn = true;
        msg_view.innerHTML = "Your Turn";
        msg_view.style.textDecoration = "underline";
        update_gameboard();
    });

    gameroom.onOpponentsTurn(() => {
        console.log("OpponentsTurn");
        my_turn = false;
        msg_view.innerHTML = `Waiting for Player #${other_player_no} (${other_player_symbol})`;
        msg_view.style.textDecoration = "none";
        update_gameboard();
    });

    gameroom.onClose(() => {
        console.log("closed!");
        closed = true;
        let result;
        my_turn = false;
        if(gameroom.data.verdict === 0) {
            result = "Draw!";
        } else {
            if(gameroom.data.verdict === player_no) {
                result = "You Won!";
            } else {
                result = "You Loose!";
            }
        }
        msg_view.innerHTML = result;
        player_info.innerHTML = result;
        update_gameboard();
    });

    back_btn.onclick = () => {
        if(closed) {
            let new_msg = {user_id: msg.user_id, token: msg.token};
            return sm.switch($.scene.id, "scene-create-join", new_msg);
        }
        popup_show("Are you sure, you want to leave this game?",
            {"No": popup_hide,
            "Yes": () => {
                popup_hide();
                let new_msg = {user_id: msg.user_id, token: msg.token};
                sm.switch($.scene.id, "scene-create-join", new_msg);
            }})
    }

});


