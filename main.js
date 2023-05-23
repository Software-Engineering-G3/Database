import { Server } from "socket.io"
import mongoose from "mongoose"
import { SerialPort } from 'serialport'
import { ReadlineParser } from "@serialport/parser-readline"
import Log from "./models/log.js"
import Player from "./components/player.js"
import Status from "./models/status.js"
import { readFileSync } from "fs"
import { createServer } from "https"
import { createServer as createhttpServer} from "http"
import { glob } from "glob"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

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

  player.addEventListener("paused", () => { 
    for(const clientId in clients){
      clients[clientId].emit("Info", [].concat(player.json()))
    }
  })
  player.addEventListener("playing-next-title", () => { 
    for(const clientId in clients){
      clients[clientId].emit("Info", [].concat(player.json()))
    }
   })
  player.addEventListener("playing-prev-title", () => { 
    for(const clientId in clients){
      clients[clientId].emit("Info", [].concat(player.json()))
    }
  })
  player.addEventListener("volumechanged", () => {
    for(const clientId in clients){
      clients[clientId].emit("Info", [].concat(player.json()))
    }
   })

  socket.on("+play music", async () => { player.play(); 
    for(const clientId in clients){
      clients[clientId].emit("Info", [].concat(player.json()))
    } 
  });
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