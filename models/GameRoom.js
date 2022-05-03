const utils = require("../utils");

class GameRoom {

    constructor(db_pool, user) {
        this.db_pool = db_pool;
        this.user = user;
    }



    create() {
        return new Promise(async(resolve, reject) => {
            // get connection to database from pool
            var connection;
            try {
                connection = await utils.getConnection(this.db_pool);
            } catch(e) { return reject("DB_CONN_ERROR"); }

            let player_no = utils.random_choice([1, 2]);
            let user1_id, user2_id;
            if(player_no === 1) {
                user1_id = this.user.user_id; user2_id = null;
            } else if(player_no === 2) {
                user1_id = null; user2_id = this.user.user_id;
            }
            let created_by = player_no, created_on = (new Date()).getTime();
            let gameboard = "         ", turn_counter = 0;
            /* -2 means game not yet started, waiting for a player to join */
            let verdict = -2;

            // query the database
            connection.query(`
                INSERT INTO GameRoom(
                    user1_id, user2_id, created_by, gameboard,
                    turn_counter, verdict, created_on
                )
                VALUES(?, ?, ?, ?, ?, ?, ?);`,
                [user1_id, user2_id, created_by, gameboard,
                    turn_counter, verdict, created_on],
                (error, results, fields) => {
                    console.log(error);
                    connection.release();
                    if(error) { return reject("DB_ERROR"); }
                    this.user1_id = parseInt(user1_id);
                    this.user2_id = parseInt(user2_id);
                    this.created_by = created_by; this.gameboard = gameboard;
                    this.turn_counter = turn_counter; this.verdict = verdict;
                    this.created_on = created_on; this.gameroom_id = results.insertId;
                    resolve(this);
            });
        });  
    }

    fetch(gameroom_id) {
        return new Promise(async(resolve, reject) => {
            // get connection to database from pool
            var connection;
            try {
                connection = await utils.getConnection(this.db_pool);
            } catch(e) { return reject("DB_CONN_ERROR"); }

            // query the database
            connection.query(`SELECT * FROM GameRoom WHERE gameroom_id = ?`,
                [gameroom_id], (error, results, fields) => {
                console.log(error);
                connection.release();
                if(error) { return reject("DB_ERROR"); }
                console.log(results, results.length);
                console.log("gameroom_id - ", gameroom_id);
                if(results.length === 0) { return reject("GAMEROOM_DOES_NOT_EXIST"); }
                let result = results[0];
                this.user1_id = parseInt(result.user1_id);
                this.user2_id = parseInt(result.user2_id);
                this.created_by = result.created_by; this.gameboard = result.gameboard;
                this.turn_counter = result.turn_counter; this.verdict = result.verdict;
                this.created_on = result.created_on; this.gameroom_id = result.gameroom_id;
                resolve(this);
            });
        });
    }

    add_player(user_id) {
        if(this.created_by === 1) {
            this.user2_id = user_id;
        } else if(this.created_by === 2) {
            this.user1_id = user_id;
        }
        /* -1 means game is running */
        this.verdict = -1;
        this.turn_counter = 1;

        return new Promise(async(resolve, reject) => {
            // get connection to database from pool
            var connection;
            try {
                connection = await utils.getConnection(this.db_pool);
            } catch(e) { return reject("DB_CONN_ERROR"); }

            // query the database
            connection.query(`
                UPDATE GameRoom SET user1_id = ?, user2_id = ?, verdict = ?,
                    turn_counter = ?
                WHERE gameroom_id = ?
            `,
            [this.user1_id, this.user2_id, this.verdict,
                this.turn_counter, this.gameroom_id],
            (error, results, fields) => {
                connection.release();
                if(error) { return reject("DB_ERROR"); }
                resolve(this);
            });
        });
    }

    data() {
        return {
            user1_id: this.user1_id, user2_id: this.user2_id,
            created_by: this.created_by, gameboard: this.gameboard,
            turn_counter: this.turn_counter, verdict: this.verdict,
            created_on: this.created_on, gameroom_id: this.gameroom_id
        }
    }

    play(pos, symbol) {
        this.turn_counter++;
        let gameboard = this.gameboard;
        if(gameboard[pos] === " ") {
            let new_gameboard = gameboard.split('');
            new_gameboard[pos] = symbol;
            this.gameboard = new_gameboard.join('');
            gameboard = this.gameboard;
        }

        let top = gameboard[0] + gameboard[1] + gameboard[2];
        let left = gameboard[0] + gameboard[3] + gameboard[6];
        let right = gameboard[2] + gameboard[5] + gameboard[8];
        let bottom = gameboard[6] + gameboard[7] + gameboard[8];
        let top_left_bottom_right = gameboard[0] + gameboard[4] + gameboard[8];
        let top_right_bottom_left = gameboard[2] + gameboard[4] + gameboard[6];
        let top_bottom = gameboard[1] + gameboard[4] + gameboard[7];
        let left_right = gameboard[3] + gameboard[4] + gameboard[5];

        let vals = [top, left, right, bottom, top_left_bottom_right,
            top_right_bottom_left, top_bottom, left_right]
            .map(this.check_strip.bind(this));
        
        let won = null;
        for(var i=0; i<vals.length; i++) {
            let val = vals[i];
            if(val === 1 || val === 2) {
                won = val; break;
            }
        }

        if(won === 1 || won === 2) {
            this.verdict = won;
            return this.save_gameboard();
        }

        let draw = true;
        for(var i=0; i<vals.length; i++) {
            let val = vals[i];
            if(val !== 0) {
                draw = false; break;
            }
        }

        if(draw) {
            this.verdict = 0;
            return this.save_gameboard();
        }

        return this.save_gameboard();
    }

    save_gameboard() {
        return new Promise(async(resolve, reject) => {
            // get connection to database from pool
            var connection;
            try {
                connection = await utils.getConnection(this.db_pool);
            } catch(e) { return reject("DB_CONN_ERROR"); }

            // query the database
            connection.query(`
                UPDATE GameRoom SET gameboard = ?, verdict = ?,
                    turn_counter = ?
                WHERE gameroom_id = ?
            `,
            [this.gameboard, this.verdict,
                this.turn_counter, this.gameroom_id],
            (error, results, fields) => {
                console.log(error);
                connection.release();
                if(error) { return reject("DB_ERROR"); }
                resolve(this);
            });
        });
    }

    check_strip(strip) {
        let symbols = strip.split(" ").join("");
        if(symbols.length === 0) {
            return -1;
        }
        if(symbols.length === 3) {
            if(symbols[0] === symbols[1]
                && symbols[1] === symbols[2]) {
                let symbol = symbols[0];
                if(symbol === "X") {
                    return 1;
                } else if(symbol === "O") {
                    return 2;
                }
            } else {
                return 0;
            }
        }
        if(symbols.length === 2) {
            if(symbols[0] === symbols[1]) {
                return -1;
            } else {
                return 0;
            }
        }
        if(symbols.length === 1) {
            return -1;
        }
    }
}


module.exports = GameRoom;

