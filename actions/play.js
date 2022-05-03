const utils = require("../utils");
const User = require("../models/User");
const GameRoom = require("../models/GameRoom");

function gameroom_play(ws, msg, options) {
    let db_pool = options.db_conn_pool;
    console.log(msg);

    // Fetch gameroom_id
    if(!Number.isInteger(msg.gameroom_id) && !isNaN(parseInt(msg.gameroom_id))) { return null; }
    msg.gameroom_id = parseInt(msg.gameroom_id);
    let gameroom_id = msg.gameroom_id;

    // Fetch pos
    if(!Number.isInteger(msg.pos) && !isNaN(parseInt(msg.pos))) { return null; }
    let pos = parseInt(msg.pos);
    if(pos < 1 || pos > 9) { return null; }

    if(!(ws.user_id && ws.token)) { return null; }
    let user = new User(db_pool, ws.user_id);
    let gameroom = new GameRoom(db_pool, user);
    let player_symbol, player_no, other_player;

    return new Promise(async(resolve, reject) => {

        try {
            await gameroom.fetch(gameroom_id);
        } catch(e) { return reject(e); }
        if(gameroom.verdict !== -1) { return resolve(null); }

        console.log("checking player");
        if(ws.user_id === gameroom.user1_id) {
            player_symbol = "X"; player_no = 1; other_player = gameroom.user2_id;
        } else if(ws.user_id === gameroom.user2_id) {
            player_symbol = "O"; player_no = 2; other_player = gameroom.user1_id;
        } else {
            return resolve(null);
        }
        console.log("player_symbol - ", player_symbol);
        console.log(`user_id = ${ws.user_id}, turn_counter = ${gameroom.turn_counter}`);

        if(player_no % 2 !== gameroom.turn_counter % 2) {
            return resolve(null);
        }

        let temp = gameroom.gameboard[pos-1];
        console.log("temp - ", temp);
        console.log(gameroom, gameroom.gameboard);
        if(temp === " ") {
            try {
                await gameroom.play(pos-1, player_symbol);
            } catch(e) { console.log(e); reject(e); }
            console.log("gameroom - ", gameroom);

            let gameroom_data = gameroom.data();
            
            if(other_player in options.connected_users) {
                let ws1 = options.connected_users[other_player];
                if(gameroom_data.verdict >= 0) {
                    ws1.send(JSON.stringify({
                        type: "gameroom_closed", gameroom: gameroom_data
                    }));
                } else {
                    ws1.send(JSON.stringify({
                        type: "gameroom_play_now", gameroom: gameroom_data
                    }));
                }
            }

            if(gameroom_data.verdict >= 0) {
                return resolve({
                    success: true, type: "gameroom_closed",
                    gameroom: gameroom_data});
            } else {
                return resolve({ success: true, gameroom: gameroom_data});
            }
        } else {
            return resolve(null);
        }
    });

}


module.exports = gameroom_play;
