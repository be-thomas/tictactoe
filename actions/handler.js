const utils = require("../utils");
const login_handler = require("./login");
const register_handler = require("./register");
const gameroom_create = require("./create");
const gameroom_join_request = require("./join_request");
const gameroom_join_accept = require("./join_accept");
const gameroom_join_reject = require("./join_reject");
const gameroom_play = require("./play");

function respond(handler, ws, msg, options) {
    let ret = handler(ws, msg, options);
    if(ret === null) { return; }
    if(utils.is_promise(ret)) {
        ret.then(o => {
            if(o === null) { return; }
            if(utils.is_obj(o)) {
                if("_msg_uid" in msg) {
                    o._msg_uid = msg._msg_uid;
                }
                return ws.send(JSON.stringify(o));
            }
        })
        .catch(e => {
            let o = {success: false, error: e};
            if("_msg_uid" in msg) {
                o._msg_uid = msg._msg_uid;
            }
            return ws.send(JSON.stringify(o));
        });
    } else if(utils.is_obj(ret)) {
        if("_msg_uid" in msg) {
            ret._msg_uid = msg._msg_uid;
        }
        ws.send(JSON.stringify(ret));
    }
}

function message_handler(ws, message, isBinary, options) {
    ws.last_msg = (new Date()).getTime();

    let msg_str = Buffer.from(message).toString();
    
    let msg;
    try {
        msg = JSON.parse(msg_str);
    } catch(e) { console.log(e); return; }

    if(msg.type === "login") {
        respond(login_handler, ws, msg, options);
    
    } else if(msg.type === "register") {
        respond(register_handler, ws, msg, options);
    
    } else if(msg.type === "pong") {
        console.log("ponged");
        // Dont do anything

    } else if(msg.type === "gameroom_create") {
        respond(gameroom_create, ws, msg, options);

    } else if(msg.type === "gameroom_join_request") {
        respond(gameroom_join_request, ws, msg, options);

    } else if(msg.type === "gameroom_join_accept") {
        respond(gameroom_join_accept, ws, msg, options);
    
    } else if(msg.type === "gameroom_join_reject") {
        respond(gameroom_join_reject, ws, msg, options);
    
    } else if(msg.type === "gameroom_play") {
        respond(gameroom_play, ws, msg, options);

    } else {
        console.log("Error!", msg);
    }
}


module.exports = message_handler;
