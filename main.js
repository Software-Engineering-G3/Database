import { Server } from "socket.io"
import jwtAuth from 'socketio-jwt-auth'
import mongoose from "mongoose"
import { SerialPort } from 'serialport'
import { ReadlineParser } from "@serialport/parser-readline"
import Log from "./models/log.js"
import Player from "./components/player.js"
import User from "./models/user.js"
import Status from "./models/status.js"
import { readFileSync } from "fs"
import { createServer } from "https"
import { createServer as createhttpServer} from "http"
import { glob } from "glob"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import jwt from 'jsonwebtoken'

dotenv.config()

var clients = {}

const httpsServer = createServer({
  key: readFileSync("key/server-key.pem"),
  cert: readFileSync("key/server-cert.pem")
});

const httpServer = createhttpServer({})


// Bypass CORS policy
const io = new Server({
  cors: {
    origin: '*'
  }
});

//const withAuthorization = auth0Middleware('dev-zjoski2ed4a7qjp3.us.auth0.com/');
io.use((socket, next) => {
  const token = socket.handshake.query.token

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.userId
    next()
  }catch(err){
    console.log('Invalid Token received');
  }
});

const port = new SerialPort({
  path: process.env.ARDUINO_PORT || "COM3",
  baudRate: Number(process.env.BAUD_RATE) || 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  lock: true,
  autoOpen: false
});

let ArduinoConnected = false;
port.open();

//parse
const parser = port.pipe(new ReadlineParser());


port.on("open", () => {
  ArduinoConnected = true;
  console.log("Serial Port Opened, path: " + port.path + ", baudRate: " + port.baudRate);
});

port.on("error", (error) => {
  console.error("No Smart Home detected");
  console.error(error);
  //setTimeout(reconnect, 5000);
});

port.on("close", () => {
  ArduinoConnected = false;
  console.log("Serial Port Closed, path: " + port.path + ", baudRate: " + port.baudRate);
  setTimeout(reconnect, 5000);
});

function reconnect() {
  if (!ArduinoConnected) {
    port.open();
  }
}

parser.on("data", (line) => {
  const regex = /[?!&-]/g

  console.log("Received (Arduino): " + line);

  if(regex.test(line)){ // If data includes any of the command signs
    var data = split_command(line)

    const filter = { component: data[0] };
    const update = { state: Number(data[1]) };

    console.log("Component:" + filter);
    console.log("State: " + update);

    if (data != 'error') {
      Status.findOneAndUpdate(filter, update, { new: true })
        .then((document) => {
          for(const clientId in clients){
            clients[clientId].emit('Info', [document])
          }

          document.save()

          console.log("Successful!");
        })
        .catch((err) => {
          console.error(`Error: ${err}`);
        });
  
      new Log({component: data[0], state: data[1] ,feedback: 'Success!'}).save(function(err, doc) {
        if (err) return console.error(err);
        console.log("Document inserted successfully!");
      });
   }else{
      console.log("Received invalid value");
   }
  }
})


const mongoDB = 'mongodb+srv://hpmanen0:lolxd@seproject-group3.fdnfesb.mongodb.net/?retryWrites=true&w=majority';
mongoose.set("strictQuery", false);


mongoose.connect(mongoDB).then(() => {
  console.log("MongoDB connected");
}).catch(err => console.log(err));


// Define music player:
const directory = "./music/"
let songs = glob.sync(directory + '*.mp3')
const player = new Player(songs, true);

/*User.findOne({username: username}).then((user, err) => {
  const result = bcryptjs.compareSync(password, user.password)
  // console.log(user.password)
  //  console.log(compare)
  if(err || !user) return callback(new Error("User not found"))
  return callback(null, result)
});*/

const secretKey = process.env.JWT_SECRET

io.use(jwtAuth.authenticate({
  secret: secretKey,    // required, used to verify the token's signature
  algorithm: 'HS256',        // optional, default to be HS256
  succeedWithoutToken: true
}, function(payload, done) {
  console.log(payload);
  // done is a callback, you can use it as follows
  if (payload && payload.username) {
    User.findOne({id: payload.username}, function(err, user) {
      if (err) {
        // return error
        return done(err);
      }
      if (!user) {
        // return fail with an error message
        return done(null, false, 'user does not exist');
      }
      // return success with a user info
      return done(null, user);
    });
  } else {
    return done() // in your connection handler user.logged_in will be false
  }

}));

io.on("connection", (socket) => {
  clients[socket.id] = socket

  Status.find().then(result => {
    result.push(player.json()) // Append Player JSON
    console.log(result)
    socket.emit("Info", result)
  })

  socket.on("login", (message) => {
    Status.find().then(result => {
      socket.emit("Info", result)
    })
  })

  // Log which, when and for what reason a client disconnects
  socket.on("disconnect", (reason) => {
    console.log("Client disconnected: " + socket.id + ", reason: " + reason);
  });

  player.addEventListener("paused", () => { socket.emit("Info", [].concat(player.json())) })
  player.addEventListener("playing-next-title", () => { socket.emit("Info", [].concat(player.json())) })
  player.addEventListener("playing-prev-title", () => { socket.emit("Info", [].concat(player.json())) })
  player.addEventListener("volumechanged", () => { socket.emit("Info", [].concat(player.json())) })

  socket.on("+play music", async () => { player.play(); socket.emit("Info", [].concat(player.json())) });
  socket.on("+pause music", async () => { player.pause() });  
  socket.on("+stop music", async () => { player.stop() });
  socket.on("+next song", async () => { player.next() });
  socket.on("+prev song", async () => { player.prev() });
  socket.on("+volume", async (volume) => { player.changeVolume(volume) })
  socket.on("+update list", async () => { player.updateList(); });
  socket.on("+enable filemon", async () => { player.changeAutoUpdate(true); })
  socket.on("+disable filemon", async () => { player.changeAutoUpdate(false); })
  socket.on("+enable autoplay", async () => { player.changeAutoPlay(true); })
  socket.on("+disable autoplay", async () => { player.changeAutoPlay(false); })

  // On every received message
  socket.onAny((event, ...message) => {

    // Log event for name of event, Log message for event data/message
    console.log(`Got event: ${event}, with message: ${message}`);
   
    if(event.includes("-")){
      port.write(event+'\n', (err) => {
        if(err){
          return console.log('Error: ', err.message)
        }
      })
    }
  });
});


io.on("disconnect", (socket) => {
  //no more connection to socket then stop
  delete clients[socket.id]
  stopStreaming();
})

httpsServer.listen(4121);
httpServer.listen(4122);


io.attach(httpServer)
io.attach(httpsServer)


function split_command(command) {
  var commandlist = command.split("_")


  var action = commandlist[0].replace(/[?!&-]/, "")
  var state = commandlist[1]

  return [action, state]
}