let socket,
  currentRoomId = -1;

function setUpSocketConnection(adress) {
  socket = new WebSocket(adress);

  socket.onopen = function (e) {
    console.log("Connection established");
  };

  socket.onmessage = (event) => {
    const data = event.data;
    commandHandler(data);
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      socket = null;
      removeAllPieces();
      setLostServerConnectionPage();
      console.log("Connection failed! Please check your connection!");
    }
  };

  socket.onerror = function (error) {
    console.log(error);
  };
}

function commandHandler(command) {
  switch (true) {
    case command.includes("start-"):
      gameMode = "online";
      if (command.includes("white")) {
        amIWhite = true;
        myTurn = true;
      } else {
        amIWhite = false;
        myTurn = false;
      }
      playfield.parentElement.style = amIWhite
        ? ""
        : "transform: rotateZ(180deg)";
      startGame();
      break;
    case command.includes("moved"):
      synchronizeMove(command);
      break;
    case command == "full server":
      const serverMessage = document.querySelector("#serverMessage");
      serverMessage.textContent =
        "Server is full! Sorry for the inconvenience!";
      serverMessage.hidden = false;
      break;
    case command.startsWith("rooms"):
      if (currentRoomId != -1) return;
      setOnlineRoomsScreen(command.replace("rooms ", ""));
      break;
    case command.startsWith("connected-room"):
      const roomId = Number(command.replace("connected-room ", ""));
      onConnectedToRoom(roomId);
      break;
    case command.startsWith("opponent-disconnected"):
      currentRoomId = -1;
      socket.close();
      removeAllPieces();
      socket = null;
      setOpponentLeftScreen();
      break;
    case command.startsWith("castle"):
      synchCastle(command);
      break;
    case command.startsWith("en-pessant"):
      synchPessant(command);
      break;
    case command.startsWith("check-pessant"):
      synchCheckPessant(command);
      break;
    case command.startsWith("promote"):
      synchPromotion(command);
      break;
    default:
      console.log(command);
  }
}

function disconnectFromRoom() {
  socket.send("disconnect-room " + currentRoomId);
  currentRoomId = -1;
}

function onConnectedToRoom(roomId) {
  currentRoomId = roomId;
  setConnectedRoomPage(currentRoomId + 1);
}

function connectToRoom(roomId) {
  socket.send("join-room " + roomId);
}

function synchPromotion(command) {
  const id = command.replace("promote ", "");
  checkPawnPromotion(id, true);
}

function synchCheckPessant(command) {
  resetPlayfield();
  enPessants.splice(0, enPessants.length);
  const commandArr = command.split(" ");
  checkEnpessant(commandArr[1], commandArr[2], true);
}

function synchPessant(command) {
  const commandArr = command.split(" ");
  const piece = playfield.querySelector(`#${commandArr[1]}`).children[0];
  addCapturedPiece(piece.src);
  piece.remove();
  enPessants.splice(0, enPessants.length);
  resetPlayfield();
}

function synchCastle(command) {
  enPessants.splice(0, enPessants.length);
  const commandArr = command.split(" ");
  const piece1 = document.querySelector(`#${commandArr[1]}`);
  const block1 = document.querySelector(`#${commandArr[2]}`);
  const piece2 = document.querySelector(`#${commandArr[3]}`);
  const block2 = document.querySelector(`#${commandArr[4]}`);
  block1.append(piece1);
  block2.append(piece2);
  if (commandArr[1].includes("svart")) {
    specialMoves.blackKingMoved = true;
  } else {
    specialMoves.yellowKingMoved = true;
  }
  const sound = new Audio("assets/sounds/move.wav");
  sound.play();
  myTurn = true;
  displayMyTurn();
  isKingInCheck();
}

function synchronizeMove(command) {
  enPessants.splice(0, enPessants.length);
  const commandArr = command.split(" ");
  const piece = document.querySelector(`#${commandArr[1]}`);
  const block = document.querySelector(`#${commandArr[2]}`);
  if (block.children.length > 0) {
    addCapturedPiece(block.children[0].src);
    block.childNodes[0].remove();
  }
  if (commandArr[1].includes("kung")) {
    if (commandArr[1].includes("svart")) {
      specialMoves.blackKingMoved = true;
    } else {
      specialMoves.yellowKingMoved = true;
    }
  } else if (commandArr[1].includes("torn")) {
    if (commandArr[1].includes("svart")) {
      if (commandArr[1].includes("1")) {
        specialMoves.blackTower1Moved = true;
      } else {
        specialMoves.blackTower2Moved = true;
      }
    } else {
      if (commandArr[1].includes("1")) {
        specialMoves.yellowTower1Moved = true;
      } else {
        specialMoves.yellowTower2Moved = true;
      }
    }
  }
  block.append(piece);
  const sound = new Audio("assets/sounds/move.wav");
  sound.play();
  myTurn = true;
  displayMyTurn();
  winConditionMet();
  isKingInCheck();
}

function displayMyTurn() {
  const myTurnHtml = `<h3>Your turn!</h3>`;
  const div = document.createElement("div");
  div.className = "turn-switch";
  div.innerHTML = myTurnHtml;
  document.body.firstChild.before(div);

  setTimeout(() => {
    div.remove();
  }, 2500);
}
