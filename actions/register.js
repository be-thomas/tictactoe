const utils = require("../utils");
const User = require("../models/User");

function register_handler(ws, msg, options) {
    if(!(utils.is_string(msg.username)
        && utils.is_string(msg.password))) {
        return null;
    }
    let user = new User(options.db_conn_pool, msg.username);
    
    return new Promise(async(resolve, reject) => {
        try {
            await user.add(msg.password);
        } catch(e) {
            ws.close(); delete options.users_pending_login[ws.uuid];
            resolve(null);
        }

        let user_id = parseInt(user.user_id);
        let token = user.token, username = user.username;
        let resp = {success: true, user_id, token};
        if(user_id in options.connected_users) { return fail(); }
        delete options.users_pending_login[ws.uuid];
        ws.user_id = user_id; ws.token = token; ws.username = username;
        options.connected_users[user_id] = ws;
        resolve(resp);
    });
}


module.exports = register_handler;
