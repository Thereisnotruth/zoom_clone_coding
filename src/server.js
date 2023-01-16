import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug"); // view engine 설정
app.set("views", __dirname + "/views"); // views 폴더 설정

app.use("/public", express.static(__dirname + "/public")); // frontend 구동과 관련된 public 폴더 (css, js)

app.get("/", (_, res) => res.render("home")); // 라우팅
app.get("/*", (_, res) => res.render("home"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];

  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });

  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName.payload);
    done();
    socket.to(roomName.payload).emit("welcome", socket.nickname, countRoom(roomName.payload));
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (message, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname}: ${message}`);
    done();
  });

  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});
/*
const sockets = []; // fake database

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nick"] = "Anonymous";
  console.log("Connected to Browser");
  socket.on("close", () => {
    console.log("Disconnected from Browser");
  });
  socket.on("message", (msg) => {
    const message = JSON.parse(msg.toString("utf8"));

    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) => {
          aSocket.send(`${socket.nick} : ${message.payload}`);
        });
        break;
      case "nick":
        socket["nick"] = message.payload;
        break;
    }
  });
});*/

httpServer.listen(3000, handleListen);
