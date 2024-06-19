let chess = null
const boardElement = document.querySelector(".chessboard")
const id = document.querySelector(".id")
const heading = document.querySelector(".Heading")
const findmatch = document.querySelector(".findmatch")
const spectclick = document.querySelector(".spectclick")
const grabid = document.querySelector(".grabid")
const specb = document.querySelector(".specb")
const inputid = document.querySelector(".inputid")
const searchgif = document.querySelector(".searchgif")
let socket = {}
const extbt = document.querySelector(".extbt")
let draggedPiece = null
let sourceSqare = null
let playeRole = null
let current_roomid = null

const Join_match = () => {
  console.log("join match function")
  searchgif.classList.remove("hidden")
  spectclick.classList.add("hidden")
  heading.innerHTML = "wait for oppenent"
  findmatch.classList.add("hidden")
  socket = new io()
  socket.emit("add_to_lobby")
}

findmatch.addEventListener("click", () => {
  console.log("findmatch is here")
  Join_match()
  socket.on("playerroll", (role) => {
    chess = new Chess()
    playeRole = role.role
    findmatch.classList.add("hidden")
    searchgif.classList.add("hidden")
    extbt.classList.remove("hidden")
    current_roomid = role.room_id
    if (playeRole === "w" || "b") {
      inputid.classList.add("hidden")
    }
    id.innerHTML = `Room Id : ${current_roomid}`
    console.log("my room : ", current_roomid)
    heading.innerHTML = "Game started"
    renderBoard()
  })
  socket.on("spactatorroll", () => {
    playeRole = null
    grabid.innerHTML = ""
    renderBoard()
  })
  socket.on("boardstate", (fen) => {
    chess.load(fen)
    renderBoard()
  })
  socket.on("wait", () => {
    chess = null
    console.log("wait fired")
    extbt.classList.add("hidden")
    boardElement.innerHTML = ""
    id.innerHTML = ""
    current_roomid = null
    searchgif.classList.remove("hidden")
    boardElement.classList.add("hidden")
    boardElement.classList.add("hidden")
    heading.innerHTML = "Wait for opponent....."
  })
  socket.on("move", (move) => {
    chess.move(move)
    renderBoard()
  })

  socket.on("home", () => {
    socket.disconnect()
    chess = null
    console.log("Home triggered for : ", playeRole)
    heading.innerHTML = "Welcome!!!!"
    extbt.classList.add("hidden")
    boardElement.innerHTML = ""
    id.innerHTML = ""
    current_roomid = null
    playeRole = null
    boardElement.classList.add("hidden")
    id.classList.add("hidden")
    specb.classList.remove("hidden")
    findmatch.classList.remove("hidden")
  })

  specb.addEventListener("click", () => {
    const room_id_spec = grabid.value
    socket.emit("spect", room_id_spec)
    console.log("player wanna join this id : ", room_id_spec)
  })
  extbt.addEventListener("click", () => {
    chess = null
    socket.emit("exit", {
      room_id: current_roomid,
      role: playeRole,
    })
  })
})

const renderBoard = () => {
  console.log("render board is fired")
  console.log("PLAYER ROLE IS : ", playeRole)
  const board = chess.board()
  boardElement.classList.remove("hidden")
  id.classList.remove("hidden")
  boardElement.innerHTML = ""
  board.forEach((row, rowindex) => {
    row.forEach((Square, sqaureindex) => {
      //CREATE SQARE ELEMENT
      const sqareElement = document.createElement("div")

      //ADD CLASS NAMED "SQUARE" IN THE SQARE ELEMENT AND ALSO "LIGHT OR DARK"
      sqareElement.classList.add(
        "square",
        (rowindex + sqaureindex) % 2 === 0 ? "light" : "dark"
      )

      //ADDING DATASET PROPERTY TO GIVE
      sqareElement.dataset.column = sqaureindex
      sqareElement.dataset.row = rowindex

      //CREATING PIECE ELEMENT
      if (Square) {
        const pieceElement = document.createElement("div")
        pieceElement.classList.add("piece")
        pieceElement.innerText = getPicesUnicode(Square)
        pieceElement.draggable = playeRole === Square.color

        //HANDLE THE "DRAG" EVENT on piece
        console.log("line above litsner")
        pieceElement.addEventListener("click", (e) => {
          console.log("clicked")
        })
        pieceElement.addEventListener("dragstart", (e) => {
          console.log("SELECTED PIECE TO DRAG : ", pieceElement)
          if (pieceElement.draggable) {
            draggedPiece = pieceElement
            sourceSqare = {
              row: rowindex,
              col: sqaureindex,
            }
            e.dataTransfer.setData("text/plain", "")
          }
        })
        //HANDLE THE "DRAGend" EVENT on piece
        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null
          sourceSqare = null
        })

        sqareElement.appendChild(pieceElement)
      }

      sqareElement.addEventListener("dragover", (e) => {
        e.preventDefault()
      })

      //HANDLE THE "DRop" EVENT on Squareelemnt
      sqareElement.addEventListener("drop", (e) => {
        e.preventDefault()
        if (draggedPiece) {
          const targetsource = {
            row: parseInt(sqareElement.dataset.row),
            col: parseInt(sqareElement.dataset.column),
          }

          handleMove(sourceSqare, targetsource)
        }
      })
      boardElement.appendChild(sqareElement)
    })
  })
}
// const renderBoard = () => {
//   console.log("PLAYER ROLE IS:", playerRole)

//   const board = chess.board()
//   boardElement.classList.remove("hidden")
//   id.classList.remove("hidden")
//   boardElement.innerHTML = ""

//   // Determine if the board should be flipped
//   const isBlackPlayer = playerRole === "black"

//   // Traverse the board, reversing rows and columns if black player
//   for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
//     const actualRowIndex = isBlackPlayer
//       ? board.length - 1 - rowIndex
//       : rowIndex

//     for (
//       let squareIndex = 0;
//       squareIndex < board[actualRowIndex].length;
//       squareIndex++
//     ) {
//       const actualSquareIndex = isBlackPlayer
//         ? board[actualRowIndex].length - 1 - squareIndex
//         : squareIndex

//       // Create square element
//       const squareElement = document.createElement("div")

//       // Add classes for "square" and "light" or "dark"
//       squareElement.classList.add(
//         "square",
//         (actualRowIndex + actualSquareIndex) % 2 === 0 ? "light" : "dark"
//       )

//       // Add dataset properties for row and column
//       squareElement.dataset.column = actualSquareIndex
//       squareElement.dataset.row = actualRowIndex

//       // Create piece element if there's a piece on the square
//       if (board[actualRowIndex][actualSquareIndex]) {
//         const piece = board[actualRowIndex][actualSquareIndex]
//         const pieceElement = document.createElement("div")
//         pieceElement.classList.add("piece")
//         pieceElement.innerText = getPicesUnicode(piece)
//         pieceElement.draggable = piece.color === playerRole // Draggable if piece color matches player role

//         // Handle drag events
//         pieceElement.addEventListener("dragstart", (e) => {
//           if (pieceElement.draggable) {
//             draggedPiece = pieceElement
//             sourceSquare = {
//               row: actualRowIndex,
//               col: actualSquareIndex,
//             }
//             e.dataTransfer.setData("text/plain", "")
//           }
//         })

//         pieceElement.addEventListener("dragend", () => {
//           draggedPiece = null
//           sourceSquare = null
//         })

//         squareElement.appendChild(pieceElement)
//       }

//       // Handle dragover and drop events
//       squareElement.addEventListener("dragover", (e) => {
//         e.preventDefault()
//       })

//       squareElement.addEventListener("drop", (e) => {
//         e.preventDefault()
//         if (draggedPiece) {
//           const targetSquare = {
//             row: parseInt(squareElement.dataset.row),
//             col: parseInt(squareElement.dataset.column),
//           }
//           handleMove(sourceSquare, targetSquare)
//         }
//       })

//       boardElement.appendChild(squareElement)
//     }
//   }
// }

const getPicesUnicode = (piece) => {
  const unicodePieces = {
    w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
    b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟︎" },
  }

  return unicodePieces[piece.color][piece.type.toUpperCase()] || ""
}

const handleMove = (source, target) => {
  console.log("Start: ", source, " | ", "end: ", target)
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  }
  console.log("MOVE ", move)
  socket.emit("move", { move, room_id: current_roomid })
}

// IO EVENTS
