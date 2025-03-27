CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT UNIQUE NOT NULL,
    passWord TEXT NOT NULL,
    emailAddr TEXT,
    verifyCode TEXT,
    outDate DATETIME,
    partData TEXT,
    partModifyDate DATETIME
);
