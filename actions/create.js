const utils = require("../utils");
const User = require("../models/User");
const GameRoom = require("../models/GameRoom");

function gameroom_create(ws, msg, options) {
    let db_pool = options.db_conn_pool;
    if(!(ws.user_id && ws.token)) { return null; }

    let user = new User(db_pool, ws.user_id);
    console.log([user.user_id, user.username]);
    console.log(ws.user_id);
    let gameroom = new GameRoom(db_pool, user);
    return new Promise(async(resolve, reject) => {
        try {
            await gameroom.create();
        } catch(e) { return reject(e); }

        resolve({success: true, gameroom_data: gameroom.data()});
    });
}


module.exports = gameroom_create;
