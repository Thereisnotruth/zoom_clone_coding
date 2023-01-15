import http from "http";
import WebSocket from "ws";
import express from "express";
import { type } from "os";
import { parse } from "path";

const app = express();

app.set("view engine", "pug"); // view engine 설정
app.set("views", __dirname + "/views"); // views 폴더 설정

app.use("/public", express.static(__dirname + "/public")); // frontend 구동과 관련된 public 폴더 (css, js)

app.get("/", (_, res) => res.render("home")); // 라우팅
app.get("/*", (_, res) => res.render("home"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// app.listen(3000, handleListen);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
});

server.listen(3000, handleListen);
