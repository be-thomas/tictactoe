class TicTacToe_User {

    constructor(server_url) {
        this.server_url = TicTacToe.server_url(server_url);
        this.ws_url = TicTacToe.ws_url(server_url);
    }

    register(username, password) {
        return this.login_or_register(username, password, "register");
    }

    login(username, password) {
        return this.login_or_register(username, password, "login");
    }

    login_or_register(username, password, action) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.ws_url);
            // declare variables
            this.awaiting_response = {};
            this.consumers = {};
            this.msg_cb = null;

            // When message Arrives
            this.ws.onmessage = event => {
                let msg = event.data;
                try {
                    msg = JSON.parse(msg);
                } catch(e) { return; }
                console.log(msg);
                // First check, if this message is a reply
                // to a previous message
                if(msg._msg_uid in this.awaiting_response) {
                    let resolve_ = this.awaiting_response[msg._msg_uid][0];
                    resolve_(msg);
                    delete this.awaiting_response[msg._msg_uid];
                    return;
                }
                // Check if this message is being consumed by any consumer
                if(this.consumers) {
                    Object.keys(this.consumers).forEach(key => {
                        let cb = this.consumers[key];
                        if(cb(msg)) { return; }
                    });
                }
                // Otherwise, its a normal message
                if(this.msg_cb) {
                    this.msg_cb(msg);
                }
            }

            this.ws.onopen = event => {
                // try to login/register
                this.get_response(Number.isInteger(username)
                    ? {type: action, user_id: username, token: password}
                    : {type: action, username, password})
                    .then(resp => {
                        if(resp.success) {
                            this.user_id = resp.user_id;
                            this.token = resp.token;
                        }
                        this.addConsumer("ping", msg => msg.type == "ping" ? this.send({type: "pong"}) : false);
                        resolve(resp);
                    })
                    .catch(e => reject(action === "register" ? "USERNAME_TAKEN": "INVALID_CREDENTIALS"))
            }

            this.ws.onerror = event => {
                // call error handler if attached
                if(this.error_cb) {
                    this.error_cb(event);
                }
            }

            this.ws.onclose = event => {
                // if socket closes, reject all promises
                // which are waiting for response
                Object.keys(this.awaiting_response).forEach(msg_uid => {
                    let reject_ = this.awaiting_response[msg_uid][1];
                    reject_("CONNECTION_CLOSED");
                    delete this.awaiting_response[msg_uid];
                });
                // call close handler if attached
                if(this.close_cb) {
                    this.close_cb(event);
                }
            }
        });
    }

    send(msg) {
        if(!TicTacToe.is_string(msg)) {
            msg = JSON.stringify(msg);
        }
        this.ws.send(msg);
        console.log(msg);
        return true;
    }

    get_response(msg) {
        if(!this.ws) { return; }

        // create msg Unique ID
        let curTime = (new Date()).getTime();
        let n = TicTacToe.randint(1, 10000);
        let msg_uid = curTime.toString(16) + n.toString(16);

        // If ID clashes, rebuild, new ID
        if(msg_uid in this.awaiting_response) {
            return this.get_response(msg);
        }

        // set message ID
        msg._msg_uid = msg_uid;

        // Promise resolve, on response
        return new Promise((resolve, reject) => {
            this.awaiting_response[msg_uid] = [resolve, reject];
            let msg_str = JSON.stringify(msg);
            this.ws.send(msg_str);
        });
    }

    create_GameRoom() {
        return new Promise((resolve, reject) => {
            this.get_response({type: "gameroom_create"})
                .then(resp => {
                    let gameroom_data = resp.gameroom_data;
                    let gameroom_id = gameroom_data.gameroom_id;
                    let gameroom = new TicTacToe_GameRoom(this, gameroom_id);
                    gameroom.setData(gameroom_data);
                    resolve(gameroom);
                }).catch(error => { console.log(error); reject(error) })
        });
    }

    join_GameRoom(gameroom_id) {
        this.send({type: "gameroom_join_request", gameroom_id});
        return new TicTacToe_GameRoom(this, gameroom_id);
    }

    addConsumer(name, consumer) {
        this.consumers[name] = consumer;
    }

    logout() {
        this.ws.close();
    }

    onMessage(cb) {
        this.msg_cb = cb;
    }

    onClose(cb) {
        this.close_cb = cb;
    }

    onError(cb) {
        this.error_cb = cb;
    }

}



class TicTacToe_GameRoom {

    constructor(ticTacToe_User, gameroom_id) {
        this.user = ticTacToe_User;
        this.gameroom_id = gameroom_id;
        this.user.addConsumer("gameroom", this.consumeMessage.bind(this));
        this.onJoinRequest_cb = null;
        this.data = null;
    }

    consumeMessage(msg) {
        if(msg.type === "gameroom_join_request") {
            if(this.onJoinRequest_cb) {
                msg.accept = () => {
                    let gameroom_id = msg.gameroom_id;
                    let user_id = msg.user_id;
                    return new Promise((resolve, reject) => {
                        this.user.get_response({type: "gameroom_join_accept", gameroom_id, user_id})
                        .then(resp => {
                            this.setData(resp.gameroom);
                            return resp.success ? resolve(this) : reject(resp.error);
                        })
                        .catch(e => reject("SERVER_ERROR"));
                    });
                };
                msg.reject = () => {
                    let gameroom_id = msg.gameroom_id;
                    let user_id = msg.user_id;
                    this.user.get_response({type: "gameroom_join_reject", gameroom_id, user_id})
                        .then(_ => {})
                        .catch(_ => {});
                };
                this.onJoinRequest_cb(msg);
            }
            return true;
        } else if(msg.type === "gameroom_join_accepted") {
            if(this.onJoinAccepted_cb) {
                this.setData(msg.gameroom);
                this.onJoinAccepted_cb(this);
            }
            return true;

        } else if(msg.type === "gameroom_join_rejected") {
            if(this.onJoinRejected_cb && msg.gameroom_id === this.gameroom_id) {
                this.onJoinRejected_cb();
            }
            return true;
        } else if(msg.type === "gameroom_play_now") {
            this.setData(msg.gameroom);
            if(this.onMyTurn_cb) {
                this.onMyTurn_cb(this);
            }
        } else if(msg.type === "gameroom_closed") {
            this.setData(msg.gameroom);
            if(this.onClose_cb) {
                this.onClose_cb(this);
            }
        }
        return false;
    }

    onMyTurn(cb) {
        this.onMyTurn_cb = cb;
        if(this.user.user_id === this.data.user1_id) {
            this.onMyTurn_cb(this);
        }
    }

    onOpponentsTurn(cb) {
        this.onOpponentsTurn_cb = cb;
        if(this.user.user_id === this.data.user2_id) {
            this.onOpponentsTurn_cb(this);
        }
    }

    play(pos) {
        let gameroom_id = this.gameroom_id;
        let msg = {type: "gameroom_play", pos, gameroom_id};
        return new Promise((resolve, reject) => {
            this.user.get_response(msg)
            .then(resp => {
                if(resp.success) {
                    console.log("resp.gameroom - ", resp.gameroom);
                    this.setData(resp.gameroom);
                    resolve(this);
                    console.log("verdict - ", this.data.verdict);
                    if(this.data.verdict < 0) {
                        console.log("onOpponentsTurn_cb - ", this.onOpponentsTurn_cb);
                        if(this.onOpponentsTurn_cb) {
                            this.onOpponentsTurn_cb();
                        }
                    } else {
                        if(this.onClose_cb) {
                            this.onClose_cb();
                        }
                    }
                } else { reject(resp.error); }
            })
            .catch(e => reject(e));
        });
    }

    onClose(cb) {
        this.onClose_cb = cb;
    }

    onJoinRequest(cb) {
        this.onJoinRequest_cb = cb;
    }

    onJoinAccepted(cb) {
        this.onJoinAccepted_cb = cb;
    }

    onJoinRejected(cb) {
        this.onJoinRejected_cb = cb;
    }

    setData(data) {
        this.data = data;
    }

    getData() {
        return this.data;
    }

}



class TicTacToe {

    constructor(server_url) {
        this.server_url = TicTacToe.server_url(server_url);
    }

    static server_url(server_url) {
        if(!server_url.endsWith("/")) { server_url = server_url + "/"; }
        if(server_url.startsWith("http")) {
            return server_url;
        } else if(server_url.startsWith(https)) {
            return server_url;
        }
        return "http://" + server_url;
    }

    static ws_url(server_url) {
        if(server_url.startsWith("https")) {
            return server_url.replace("https", "wss");
        } else if(server_url.startsWith("http")) {
            return server_url.replace("http", "ws");
        }
    }

    static is_string(s) {
        typeof s === 'string' || s instanceof String
    }

    /*
        returns random integer, min(inclusive) max(inclusive)
    */
    static randint(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return parseInt(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    User() {
        return new TicTacToe_User(this.server_url);
    }

    GameRoom(ticTacToe_User) {
        return new TicTacToe_GameRoom(this.server_url, ticTacToe_User);
    }
}


