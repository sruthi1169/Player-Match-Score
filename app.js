const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayersDetailsObjToResponseObj = (eachPlayerObject) => {
  return {
    playerId: eachPlayerObject.player_id,
    playerName: eachPlayerObject.player_name,
  };
};

const convertDBMatchObjToResponseObj = (matchDetailsObj) => {
  return {
    matchId: matchDetailsObj.match_id,
    match: matchDetailsObj.match,
    year: matchDetailsObj.year,
  };
};

const convertPlayerMatchesObjToResponseObj = (matchObj) => {
  return {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  };
};

const convertEachMatchObjToResponseObj = (eachMatchObj) => {
  return {
    playerId: eachMatchObj.player_id,
    playerName: eachMatchObj.player_name,
  };
};

//API 1 GET METHOD get all players in the table

app.get("/players/", async (require, response) => {
  const getAllPlayers = `
        SELECT
            *
        FROM
            player_details
        ORDER BY
            player_id;
    `;
  const playersArray = await database.all(getAllPlayers);
  response.send(
    playersArray.map((eachPlayerObject) =>
      convertPlayersDetailsObjToResponseObj(eachPlayerObject)
    )
  );
});

//API2 METHOD GET, Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const singlePlayerDetailsQuery = `
        SELECT
            * 
        FROM
            player_details
        WHERE
            player_id = ${playerId};
    `;
  const playerDetails = await database.get(singlePlayerDetailsQuery);
  response.send(convertPlayersDetailsObjToResponseObj(playerDetails));
});

//API3 METHOD PUT, Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
        UPDATE
            player_details
        SET
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};
    `;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

//  API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};
    `;
  const matchDetailsObj = await database.get(getMatchQuery);
  response.send(convertDBMatchObjToResponseObj(matchDetailsObj));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT
            match_id,match,year
        FROM
            match_details NATURAL JOIN player_match_score
        WHERE
            player_match_score.player_id = ${playerId};
    `;
  const playerMatchesObj = await database.all(getMatchesQuery);
  response.send(
    playerMatchesObj.map((matchObj) =>
      convertPlayerMatchesObjToResponseObj(matchObj)
    )
  );
});

//API 6 GET METHOD, Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMethodQuery = `
        SELECT
            player_id,player_name
        FROM
            player_details NATURAL JOIN player_match_score
        WHERE
            player_match_score.match_id = ${matchId};
    `;
  const matchDBOArray = await database.all(getMethodQuery);
  response.send(
    matchDBOArray.map((eachMatchObj) =>
      convertEachMatchObjToResponseObj(eachMatchObj)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStaticsQuery = `
          SELECT 
             player_id AS playerId,
             player_name AS playerName,
             SUM(score) AS totalScore,
             SUM(fours) AS totalFours,
             SUM(sixes) AS totalSixes
        FROM 
           player_details NATURAL JOIN player_match_score
        WHERE
           player_details.player_id = ${playerId};
    `;
  const sumRes = await database.get(getStaticsQuery);
  response.send(sumRes);
});

module.exports = app;
