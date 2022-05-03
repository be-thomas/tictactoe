const utils = require("../utils");
const User = require("../models/User");

function login_handler(ws, msg, options) {
    /*
        ch_username = 
        true, if logging in with username, password,
        false, if logging in with user_id, token
    */
    let ch_username;
    if(utils.is_string(msg.username) && utils.is_string(msg.password)) {
        ch_username = true;
    } else if((utils.is_string(msg.user_id) || Number.isInteger(msg.user_id))
            && utils.is_string(msg.token)) {
        ch_username = false;
        msg.user_id = parseInt(msg.user_id);
        if(isNaN(msg.user_id)) {
            ws.close(); delete options.users_pending_login[ws.uuid];
            return null;
        }
    } else {
        ws.close(); delete options.users_pending_login[ws.uuid];
        return null;
    }
    /* Finished, checking params */

    let user = new User(
        options.db_conn_pool, ch_username ? msg.username : parseInt(msg.user_id)
    );
    
    return new Promise(async(resolve, reject) => {
        const fail = () => {
            ws.close(); delete options.users_pending_login[ws.uuid];
            resolve(null);
        }

        let check;
        try {
            check = await user.auth(ch_username ? msg.password : msg.token);
        } catch(e) { return fail(); }
        if(!check) { return fail(); }

        let user_id = parseInt(user.user_id);
        let token = user.token, username = user.username;
        let resp = {success: true, user_id, token};

        if(user_id in options.connected_users) { return fail(); }
        delete options.users_pending_login[ws.uuid];
        ws.user_id = user_id; ws.token = token; ws.username = username;
        options.connected_users[user_id] = ws;
        console.log(options.users_pending_login);
        console.log(options.connected_users);
        resolve(resp);
    });
}


module.exports = login_handler;
