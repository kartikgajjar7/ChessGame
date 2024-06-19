import express from "express"
import http from "http"
import { Socket, Server } from "socket.io"
import path from "path"
import { fileURLToPath } from "url"
import { Chess } from "chess.js"
import { title } from "process"
const _filename = fileURLToPath(import.meta.url)
const app = express()
const server = http.createServer(app)
const io = new Server(server)

const _dirname = path.dirname(_filename)

app.set("view engine", "ejs")
app.use(express.static(path.join(_dirname, "public")))

let waitingPlayers = [] // Queue for waiting players
let games = {} // Store game instances by room ID

let Current_Player = "W"
let players = {}

// RENDER HTML PAGEs
app.get("/", (req, res) => {
  res.render("index", { title: "Chess game" })
})

//IO Connection

io.on("connection", (uniquesocket) => {
  uniquesocket.removeAllListeners("add_to_lobby")
  uniquesocket.removeAllListeners("move")
  uniquesocket.removeAllListeners("spect")
  uniquesocket.removeAllListeners("exit")
  uniquesocket.removeAllListeners("disconnect")
  uniquesocket.on("add_to_lobby", () => {
    console.log("Player requested for (add to lobby) : ", uniquesocket.id)
    console.log(
      "Current waitingPlayers is and now pushing this player into waiting list: ",
      waitingPlayers.length
    )
    waitingPlayers.push(uniquesocket)
    console.log(
      "pushed current player to waiting list now list : ",
      waitingPlayers.length
    )
    joinLobby(uniquesocket)
  })

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white
    }
    if (uniquesocket.id === players.black) {
      delete players.black
    }
  })

  //HANDLE MOVE EVENT
  uniquesocket.on("move", (result) => {
    let move = result.move
    let game = games[result.room_id]
    let chess = game.chess
    // console.log(game)

    try {
      if (chess.turn === "W" && uniquesocket.id !== players.white) return
      if (chess.turn === "b" && uniquesocket.id !== players.black) return

      const result_of_move = chess.move(move)
      if (result_of_move) {
        io.to(result.room_id).emit("move", move)
        io.to(result.room_id).emit("boardstate", chess.fen())
      } else {
        uniquesocket.emit("invalidmove", move)
        io.emit()
      }
    } catch (err) {
      uniquesocket.emit("invalidmove", move)
      console.log(err)
      console.log("Error aaaya haaii")
    }
  })

  uniquesocket.on("spect", (roomid) => {
    joinspect(uniquesocket, roomid)
  })

  // Handle player exit
  uniquesocket.on("exit", (data) => {
    const roomId = data.room_id
    console.log(
      "Exit fired by role : ",
      data.role,
      " and id : ",
      uniquesocket.id
    )
    // Check if the game exists
    if (games[roomId]) {
      let opponent = ""
      if (data.role === "w") {
        opponent = io.sockets.sockets.get(games[data.room_id].black)
      } else {
        opponent = io.sockets.sockets.get(games[data.room_id].white)
      }
      if (opponent) {
        console.log("this is oppenent : ", opponent.id)
        console.log("this is player : ", uniquesocket.id)
      }
      io.socketsLeave(`room-${roomId}`)
      delete games[data.room_id]

      waitingPlayers.push(opponent)

      uniquesocket.emit("home")
      opponent.emit("wait", "Kindlt wait for opponent")
    } else {
      console.log("game is alredy terminated")
    }
  })
})

server.listen(3000, () => {
  console.log("server chal rha hai")
})

const joinLobby = (player_socket) => {
  console.log("the player id is into join lobby function : ", player_socket.id)
  const playerGames = Object.entries(games).filter(
    ([_, game]) =>
      game.white === player_socket.id || game.black === player_socket.id
  )
  if (playerGames.length === 0) {
    console.log("the player which requested is mnot part of any games")
  }
  if (waitingPlayers.length >= 2) {
    console.log("existing games are : ", games)
    waitingPlayers.splice(
      0,
      waitingPlayers.length,
      ...waitingPlayers.filter((value) => value !== player_socket)
    )

    const opponent_socket = waitingPlayers.pop()
    const oppGames = Object.entries(games).filter(
      ([_, game]) =>
        game.white === opponent_socket.id || game.black === opponent_socket.id
    )
    if (oppGames.length === 0) {
      console.log("the opponent which requested is mnot part of any games")
    }
    const room_id = `room-${player_socket.id}-${opponent_socket.id}`

    opponent_socket.join(room_id)
    player_socket.join(room_id)

    console.log(
      "two players are : ",
      player_socket.id,
      " | ",
      opponent_socket.id
    )
    const chess = new Chess()
    games[room_id] = {
      white: player_socket.id,
      black: opponent_socket.id,
      chess: chess,
    }

    player_socket.emit("playerroll", { role: "w", room_id })
    opponent_socket.emit("playerroll", { role: "b", room_id })
    console.log(
      `Game started in room ${room_id} between ${player_socket.id} and ${opponent_socket.id}`
    )
  } else {
    player_socket.emit("wait", "Kindlt wait for opponent")
  }
}

const joinspect = (player_socket, roomid) => {
  waitingPlayers.splice(
    0,
    waitingPlayers.length,
    ...waitingPlayers.filter((value) => value !== player_socket)
  )
  player_socket.join(roomid)
  player_socket.emit("spactatorroll", { role: "s", roomid })
}
