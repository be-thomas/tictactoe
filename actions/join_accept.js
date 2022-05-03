const utils = require("../utils");
const User = require("../models/User");
const GameRoom = require("../models/GameRoom");

function gameroom_join_accept(ws, msg, options) {
    let db_pool = options.db_conn_pool;
    console.log(msg);

    if(!Number.isInteger(msg.user_id) && !isNaN(parseInt(msg.user_id))) { return null; }
    msg.user_id = parseInt(msg.user_id);

    if(!Number.isInteger(msg.gameroom_id) && !isNaN(parseInt(msg.gameroom_id))) { return null; }
    msg.gameroom_id = parseInt(msg.gameroom_id);
    let gameroom_id = msg.gameroom_id;

    if(!(ws.user_id && ws.token)) { return null; }
    let user = new User(db_pool, ws.user_id);
    let gameroom = new GameRoom(db_pool, user);


    return new Promise(async(resolve, reject) => {
        if(!(msg.user_id in options.connected_users)) {
            reject("USER_OFFLINE");
        }

        let ws1 = options.connected_users[msg.user_id];
        if(msg.gameroom_id !== ws1.join_request) {
            reject("USER_CANCELLED_REQUEST");
        }

        try {
            await gameroom.fetch(gameroom_id);
        } catch(e) { return reject(e); }

        let created_by = gameroom.created_by===1
            ? gameroom.user1_id
            : gameroom.user2_id;
        if(created_by !== ws.user_id) { ws.close(); return resolve(null); }

        try {
            await gameroom.add_player(msg.user_id);
        } catch(e) { return reject(e); }

        let gameroom_data = gameroom.data();

        delete ws1.join_request;
        ws1.gameroom_id = gameroom_id;
        ws1.send(JSON.stringify({
            type: "gameroom_join_accepted", gameroom: gameroom_data
        }));
        resolve({success: true, gameroom: gameroom_data});
    });
}


module.exports = gameroom_join_accept;
