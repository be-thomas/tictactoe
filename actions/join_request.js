const utils = require("../utils");
const User = require("../models/User");
const GameRoom = require("../models/GameRoom");

function gameroom_join_request(ws, msg, options) {
    let db_pool = options.db_conn_pool;
    console.log(msg);

    if(!Number.isInteger(msg.gameroom_id) && isNaN(parseInt(msg.gameroom_id))) { return null; }
    msg.gameroom_id = parseInt(msg.gameroom_id);
    let gameroom_id = msg.gameroom_id;

    if(!(ws.user_id && ws.token)) { return null; }

    let user = new User(db_pool, ws.user_id);
    let gameroom = new GameRoom(db_pool, user);
    return new Promise(async(resolve, reject) => {
        try {
            await gameroom.fetch(gameroom_id);
        } catch(e) { return reject(e); }

        let created_by = gameroom.created_by===1
            ? gameroom.user1_id
            : gameroom.user2_id;
        if(!(created_by in options.connected_users)) {
            return reject("USER_OFFLINE");
        }
        let ws1 = options.connected_users[created_by];
        let username = ws.username, user_id = ws.user_id;
        ws1.send(JSON.stringify({
            type: "gameroom_join_request", username, user_id,  gameroom_id
        }));
        ws.join_request = gameroom_id;
        resolve(null);
    });
}


module.exports = gameroom_join_request;
