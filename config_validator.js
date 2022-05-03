const utils = require("./utils")
const IPv4_regex = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/.compile();
const IPv6_regex = /^((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*::((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*|((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4})){7}$/.compile();
const is_hostname = s => IPv4_regex.test(s) || IPv6_regex.test(s);

function check_file(s) {
    if(!utils.is_string(s)) {
        return `Expected String instead of "${s}"`;
    } else if(!utils.file_exists) {
        return `File "${s}" not found!`;
    }
    return true;
}

function validate(config) {
    var reqs;
    // Check if "SSL" key exists
    if ("ssl" in config) {
        const config_ssl = config["ssl"];
        reqs = { "key_file_name": check_file, "cert_file_name": check_file }
        if(!utils.checkKeys(config_ssl, reqs, "config.ssl")) {
          return false;
        }
    }

    // check if "host" and "port" keys exist for binding to
    reqs = {
        "host": s => utils.is_string(s) && is_hostname(s),
        "port": n => Number.isInteger(n) && n <= 65535 && n >= 0
    };
    if(!utils.checkKeys(config, reqs, "config")) {
        return false;
    }

    // check if MySQL Database credentials exist, for connecting to
    reqs = { "mysql": s => true }
    if(!utils.checkKeys(config, reqs, "config")) {
        return false;
    } else {
        var config_mysql = config["mysql"];
        reqs = {
            "db_username": utils.is_string,
            "db_password": utils.is_string,
            "db_name": utils.is_string,
            "db_host": utils.is_string,
            "db_port": Number.isInteger,
            "db_connection_limit": Number.isInteger,
        }
        if(!utils.checkKeys(config_mysql, reqs, "config.mysql")) {
            return false;
        }
    }

    return true;
}


module.exports = {
    validate
}
