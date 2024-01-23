import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Sequelize, DataTypes} from "sequelize";

import { OfficialGameModel } from "./model/OfficialGame";
import { FreeGameModel } from "./model/FreeGame";
import { UserModel} from "./model/User";
import { TokenBlackListModel } from "./model/TokenBlackList";

import { officialGameRouter } from "./router/officialGame";
import { freeGameRouter } from "./router/freeGame";
import { authRouter } from "./router/auth";
import { userRouter } from "./router/users";

import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import jwt from "jsonwebtoken";

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/database.sqlite'
});

export const OfficialGame = OfficialGameModel(sequelize);
export const FreeGame = FreeGameModel(sequelize);
export const User = UserModel(sequelize);
export const TokenBlackList = TokenBlackListModel(sequelize);

// sequelize.sync({ force: true });
sequelize.sync();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const apiRouter = express.Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/official-games', officialGameRouter );
apiRouter.use('/free-games', freeGameRouter);
apiRouter.use('/users', userRouter);

app.use("/api", apiRouter);

const server = createServer(app);
const io = new Server(server, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
});

let playerSockets: string[] = []

interface SocketRoomMap {
  [socketId: string]: string;
}

const socketRoomMap: SocketRoomMap = {};

interface Lobby {
  startTime: number;
  objectif: number;
  difference: Map<Socket, number>;
}

interface Lobbies {
  [roomId: string]: Lobby;
}

let lobbies: Lobbies = {};

function verifyToken(token: string) {
  let bool = true;
  if (!token) {
    bool = false;
  }
  try{
    let valideToken = jwt.verify(token, process.env.JWT_SECRET!)
    if(!valideToken){
      bool = false;
    }
  }catch{
    bool = false;
  }
  return bool
}

io.on('connection', (socket) => {
  playerSockets.push(socket.id)

  socket.on('getRoomList', async (token) => {
      if(!verifyToken(token)){
        socket.emit("tokenErreur")
        socket.disconnect();
      }else{
        const roomsObj = removeElementsFromArray([...io.sockets.adapter.rooms.keys()], playerSockets);
        console.log('rooms', roomsObj);
        socket.emit('roomList', roomsObj);
      }
  });

  socket.on('joinRoom', (token, room) => {
    if(!verifyToken(token)){
      socket.emit("tokenErreur")
      socket.disconnect();
    }else{
      let adapter = io.sockets.adapter;
      let nombreDeJoueurs = adapter.rooms.get(room)?.size || 0;
      if(nombreDeJoueurs == 1){
        socket.join(room);
        socketRoomMap[socket.id] = room;
        let objectif = Math.floor(Math.random() * (10 - 3 + 1) + 3);
        lobbies[room].objectif = objectif;
        io.to(room).emit("lancer", objectif, room);
      }else{
        socket.emit("roomFull")
      }
    }
  });

  socket.on('ok', (room) => {
    let countdown = 5;
    const intervalId = setInterval(() => {
      io.to(room).emit('countdown', countdown);
      countdown--;
      if (countdown < 0) {
          // Arrêter l'intervalle
          lobbies[room].startTime = Date.now();
          io.to(room).emit('go');
          clearInterval(intervalId);
      }
  }, 1000);
  })

  socket.on('createRoom', (token) => {
    if(!verifyToken(token)){
      socket.emit("tokenErreur")
      socket.disconnect();
    }else{
      let newRoom = Date.now().toString();
      socket.join(newRoom);
      socketRoomMap[socket.id] = newRoom;
      lobbies[newRoom] = {} as Lobby;
      console.log('nouvelle rooms créée')
      const roomsObj = removeElementsFromArray([...io.sockets.adapter.rooms.keys()], playerSockets);
      console.log('rooms', roomsObj);
      io.emit('roomList', roomsObj);
    }
  });

  socket.on('time', (token) => {
    if(!verifyToken(token)){
      socket.emit("tokenErreur")
      socket.disconnect();
    }else{
      let time = Date.now();
      let theRoom = socketRoomMap[socket.id];
      let differenceInMilliseconds = time - lobbies[theRoom].startTime;
      let differenceInSeconds = differenceInMilliseconds / 1000;
      let differenceObjectif = Math.abs(differenceInSeconds - lobbies[theRoom].objectif)
      if (!lobbies[theRoom].difference || !(lobbies[theRoom].difference instanceof Map)) {
          lobbies[theRoom].difference = new Map<Socket, number>();
      }
      lobbies[theRoom].difference.set(socket, differenceObjectif)
      const differenceObject = lobbies[theRoom].difference;
      if(differenceObject.size == 2){

        let socketDefeat = [...differenceObject.keys()].reduce((a, b) => differenceObject.get(a)! > differenceObject.get(b)! ? a : b);

        let socketVictory = [...differenceObject.keys()].reduce((a, b) => differenceObject.get(a)! < differenceObject.get(b)! ? a : b);
        
        io.to(socketVictory.id).emit("victoire");
        io.to(socketDefeat.id).emit("defeat");
      }
    }
  })

});

server.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}!`)
});

function removeElementsFromArray(arr1: string[], arr2: string[]) {
  // Create a Set from the second array for faster lookup
  const elementsToRemove = new Set(arr2);

  // Filter elements from the first array that are not in the second array
  const resultArray = arr1.filter((element) => !elementsToRemove.has(element));

  return resultArray;
}