CREATE TABLE User(
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    username VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(60) NOT NULL,
    token VARCHAR(50) NOT NULL,
    created_on BIGINT NOT NULL
);


/*
    user1_id = user_id of 1st Player

    user2_id = user_id of 2nd Player

    game_board = represents the board, through 9 characters
        1st set of 3 characters is for first row of the tic tac toe board
        2nd set of 3 characters is for second row of the tic tac toe board
        3rd set of 3 characters is for second row of the tic tac toe board
        1 | 2 | 3   <- 1st row
        4 | 5 | 6   <- 2nd row
        7 | 8 | 9   <- 3rd row
    
    created_by =
        1 => user1 created this room, so he plays first
        2 => user2 created this room, so he plays first

    turn_counter = counter which keep tracks of
        number of turns played till now
    
    verdict =
        -2 => game not yet started, waiting for a player to join
        -1 => game is running
        0 => draw
        1 => user1 won
        2 => user2 won
*/
CREATE TABLE GameRoom(
    gameroom_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user1_id BIGINT NULL,
    user2_id BIGINT NULL,
    created_by INT NOT NULL,
    gameboard VARCHAR(9) NOT NULL,
    turn_counter INT NOT NULL,
    verdict INT NOT NULL,
    created_on BIGINT NOT NULL,
    FOREIGN KEY (user1_id) REFERENCES User(user_id),
    FOREIGN KEY (user2_id) REFERENCES User(user_id)
);

