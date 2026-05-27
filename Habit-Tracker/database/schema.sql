CREATE DATABASE IF NOT EXISTS habit_tracker;

USE habit_tracker;

-- ==========================
-- USERS TABLE
-- ==========================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- HABITS TABLE
-- ==========================
CREATE TABLE habits (

    habit_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    habit_name VARCHAR(150) NOT NULL,

    category VARCHAR(100),

    target_days INT NOT NULL,

    completed_today BOOLEAN DEFAULT FALSE,

    current_streak INT DEFAULT 0,

    created_date DATE DEFAULT (CURRENT_DATE),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);