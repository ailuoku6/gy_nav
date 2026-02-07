CREATE TABLE popularSites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    popularSites TEXT,
    modifyDate DATETIME
);
