const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convert = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//GET all players API

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
        SELECT * FROM player_details
        ORDER BY player_id
    `;
  const playerArray = await db.all(getPlayerQuery);
  response.send(playerArray.map((each) => convert(each)));
});

//GET single player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT * FROM player_details
        WHERE player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convert(player));
});

//PUT player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `
        UPDATE player_details
        SET 
            player_name = '${playerName}'
        WHERE 
            player_id = ${playerId}
    `;
  const updateSet = await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//GET single match API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT * FROM match_details
        WHERE match_id = ${matchId};
    `;
  const match = await db.get(getMatchQuery);
  response.send(convert(match));
});

//GET player-match API

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
        SELECT 
            match_details.match_id as matchId,
            match_details.match,
            match_details.year
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE player_id = ${playerId};
    `;
  const match = await db.all(getMatchQuery);
  response.send(match);
});

//GET matches-player API

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
        SELECT 
            player_details.player_id as playerId,
            player_details.player_name as playerName
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE match_id = ${matchId};
    `;
  const player = await db.all(getPlayerQuery);
  response.send(player);
});

//GET playerScore API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
        SELECT
            player_details.player_id as playerId,
            player_details.player_name as playerName,
            SUM(player_match_score.score) as totalScore,
            SUM(fours) as totalFours,
            SUM(sixes) as totalSixes 
        FROM 
            player_details INNER JOIN player_match_score ON
            player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};
    `;
  const player = await db.get(getPlayerScoreQuery);
  response.send(player);
});

module.exports = app;
