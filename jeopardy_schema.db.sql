BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "categories" (
	"id"	INTEGER,
	"name"	TEXT,
	"round"	TEXT,
	"game_id"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("game_id") REFERENCES "games"("id")
);
CREATE TABLE IF NOT EXISTS "clues" (
	"id"	INTEGER,
	"category_id"	INTEGER,
	"value"	TEXT,
	"question"	TEXT,
	"answer"	TEXT,
	"is_daily_double"	BOOLEAN DEFAULT 0,
	"is_final_jeopardy"	BOOLEAN DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("category_id") REFERENCES "categories"("id")
);
CREATE TABLE IF NOT EXISTS "contestants" (
	"id"	INTEGER,
	"name"	TEXT,
	"role"	TEXT,
	"game_id"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("game_id") REFERENCES "games"("id")
);
CREATE TABLE IF NOT EXISTS "games" (
	"id"	TEXT,
	"date"	TEXT,
	"season_id"	INTEGER,
	"title"	TEXT,
	"game_number"	INTEGER,
	PRIMARY KEY("id"),
	FOREIGN KEY("season_id") REFERENCES "seasons"("id")
);
CREATE TABLE IF NOT EXISTS "seasons" (
	"id"	INTEGER,
	"season_number"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);
COMMIT;
