const uuidv4 = require('uuid').v4;
const uWS = require('uWebSockets.js');
const config = require("./config.json");
const utils = require("./utils")
const config_validator = require("./config_validator");
const mysql = require('mysql');
const actions_handler = require("./actions/handler");

const PER_SEC = 1000; const PER_MIN = 60 * PER_SEC;
// maximum time, a user can wait before login (seconds)
const MAX_LOGIN_TIME = 30
const PING_TIMEOUT = 120;
const PING = JSON.stringify({type: "ping"});
let uWS_app, connected_users = {}, users_pending_login = {};

// Validate the "config.json" file contents
if(!config_validator.validate(config)) {
  process.exit(1);
}

// Setup Server With/Without SSL
if (!("ssl" in config)) {
  console.log("WARNING, No SSL Config!, running without security!");
  uWS_app = uWS.App();
} else {
  const config_ssl = config["ssl"];
  uWS_app = uWS.SSLApp(config_ssl);
}

// Connect to MySQL
const config_mysql = config.mysql
let db_conn_pool  = mysql.createPool({
  connectionLimit : config_mysql.db_connection_limit,
  host            : config_mysql.db_host,
  port            : config_mysql.db_port,
  user            : config_mysql.db_username,
  password        : config_mysql.db_password,
  database        : config_mysql.db_name,
});



uWS_app.ws('/*', {

  /* There are many common helper features */
  idleTimeout: 180,
  maxBackpressure: 1024,
  maxPayloadLength: 512,
  compression: uWS.DEDICATED_COMPRESSOR_3KB,

  /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
  open: (ws) => {
    ws.connected_on = (new Date()).getTime();
    ws.uuid = uuidv4();
    users_pending_login[ws.uuid] = ws;
    console.log(`opened ${ws.uuid}`);
  },

  message: (ws, message, isBinary) => {
    actions_handler(
      ws, message, isBinary,
      {db_conn_pool, connected_users, users_pending_login}
    );
  },

  close: (ws) => {
    if(ws.uuid in users_pending_login) {
      delete users_pending_login[ws.uuid];
    } else if(ws.user_id in connected_users) {
      delete connected_users[ws.user_id];
    }
  }
  
})
.listen(config.host, config.port, (listenSocket) => {
  if (listenSocket) { console.log('\nListening to port 9001'); }
});


setInterval(() => {
  /* Remove users, who did not login before `MAX_LOGIN_TIME` */
  Object.keys(users_pending_login).forEach(uuid => {
    let ws = users_pending_login[uuid];
    let currentTime = (new Date()).getTime();
    if(currentTime - ws.connected_on > (MAX_LOGIN_TIME * PER_SEC)) {
      ws.close();
      delete users_pending_login[uuid];
    }
  });

  Object.keys(connected_users).forEach(user_id => {
    let ws = connected_users[user_id];
    let currentTime = (new Date()).getTime();
    if(currentTime - ws.last_msg > (PING_TIMEOUT * PER_SEC)) {
      ws.send(PING);
      console.log("pinged - ", ws.user_id);
    }
  });
}, 10 * PER_SEC);

