const bcrypt = require( 'bcrypt' );
const utils = require("../utils");

class User {

    constructor(db_pool, id) {
        this.db_pool = db_pool;
        if(Number.isInteger(id)) {
            this.user_id = id;
        } else if(utils.is_string(id)) {
            this.username = id;
        }
    }

    static pwd_hash(pwd) {
        return new Promise((resolve, reject) => {
            bcrypt.hash( pwd, 10, function( err, hash ) {
                if(err) { return reject(err); }
                resolve(hash);
            });
        });
    }

    static pwd_verify(pwd, pwd_hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(pwd, pwd_hash, function( err, res ) {
                if(err) { return reject(err); }
                if(res) { resolve(res); } else { reject("INVALID_CREDENTIALS"); }
            });
        });
    }

    static generate_token(size) {
        let token = "";
        for(var i=0; i<size; i++) {
            token += utils.random_choice(utils.aplpha_nums);
        }
        return token;
    }

    /*
        rejects with error_name as string,
        resolves with insert id ( user_id )
    */
    async add(password) {
        return new Promise(async(resolve, reject) => {
            let username = this.username;
            if(!utils.is_string(username)) { reject("SERVER_ERROR"); }

            // get password hash
            var password_hash;
            try {
                password_hash = await User.pwd_hash(password);
            } catch(e) { return reject("HASH_ERROR"); }

            // get connection to database from pool
            var connection;
            try {
                connection = await utils.getConnection(this.db_pool);
            } catch(e) { return reject("DB_CONN_ERROR"); }

            let token = User.generate_token(50);
            let currentTime = (new Date()).getTime();
            // query the database
            connection.query(`INSERT INTO User(username, password_hash, token, created_on)
                VALUES(?, ?, ?, ?);`, [username, password_hash, token, currentTime],
                (error, results, fields) => {
                    connection.release();
                    console.log(error);
                    if(error) { return reject("DB_ERROR"); }
                    this.user_id = results.insertId;
                    this.password_hash = password_hash;
                    this.token = token;
                    this.created_on = currentTime;
                    resolve(this);
            });
        });
    }

    async fetch() {
        return new Promise(async(resolve, reject) => {
            let username = this.username;
            let user_id = this.user_id;

            let query = `SELECT * FROM User WHERE `;
            let deps = [];

            if(Number.isInteger(user_id)) {
                query += "user_id = ? "; deps.push(user_id);
            } else if(utils.is_string(username)) {
                query += "username = ?"; deps.push(username);
            }

            // get connection to database from pool
            var connection;
            try {
                connection = await utils.getConnection(this.db_pool);
            } catch(e) { return reject("DB_CONN_ERROR"); }

            // query the database
            connection.query(query, deps, (error, results, fields) => {
                connection.release();
                if(error) { return reject("DB_ERROR"); }
                if(results.length === 0) { return reject("USER_DOES_NOT_EXIST"); }
                let result = results[0];
                this.user_id = result.user_id;
                this.token = result.token;
                this.password_hash = result.password_hash;
                this.username = result.username;
                this.created_on = result.created_on;
                resolve(this);
            });
        });
    }

    async auth(token) {
        return new Promise(async(resolve, reject) => {
            let prev_user_id = this.user_id;
            let prev_username = this.username;
            try {
                await this.fetch()
            } catch(e) { return reject(e); }

            if(Number.isInteger(prev_user_id)) {
                resolve(token === this.token);
            } else if(utils.is_string(prev_username)) {
                let password = token;
                User.pwd_verify(password, this.password_hash)
                    .then(resp => resolve(resp))
                    .catch(e => reject(e));
            }
        });
    }

}

module.exports = User;
