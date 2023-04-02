import { Server } from "socket.io"
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
import bcryptjs from "bcryptjs"
import { glob } from "glob"

var loop;


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
  path: "COM3",
  // path: "/dev/ttyUSB0",
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
});


//parse
const parser = port.pipe(new ReadlineParser());
port.open();


port.on("open", () => {
  console.log("Serial Port Opened.");
});


parser.on("data", (data) => {
  const regex = /[?!&-]/
  if(regex.test(data)){ // If data includes any of the command signs
    var data = split_command(data)


    const filter = {component: data[0]}
    const update = {state: data[1]}
 
    if(data != 'error'){
      Status.findOneAndUpdate(filter, update, {
        new: true
      }).then((err) => {
        err.save()
        console.log("Successful!");
      })
 
      new Log({component: data[0], state: data[1] ,feedback: 'Success!'}).save(function(err, doc) {
        if (err) return console.error(err);
        console.log("Document inserted successfully!");
      });
   }else{
      console.log("Received invalid value");
   }
  }
})


port.on("error", (error) => {
  console.error("No Smart Home detected");
});


const mongoDB = 'mongodb+srv://hpmanen0:lolxd@seproject-group3.fdnfesb.mongodb.net/?retryWrites=true&w=majority';
mongoose.set("strictQuery", false);


mongoose.connect(mongoDB).then(() => { // Connect to mongoDB
  console.log("MongoDB connected");
}).catch(err => console.log(err));


// Define music player:
const directory = "./music/"
let songs = glob.sync(directory + '*.mp3')
const player = new Player(songs, true);


io.on("connection", (socket) => {
  const testUser = {
    username: "testuser",
    password: "verysafepassword"
  }
 
  User.findOne({username: testUser.username}).then((user, err) => {
    const result = bcryptjs.compareSync(testUser.password, user.password)
     // console.log(user.password)
    //  console.log(compare)
      if(result){
        console.log("yay");
      }else{
        console.log("bruh")
      }
  })


  Status.find().then(result => {
    socket.emit("Info", result)
  })


  // Log which and when a client connects
  console.log("Client connected: " + socket.id);


  // Log which, when and for what reason a client disconnects
  socket.on("disconnect", (reason) => {
    console.log("Client disconnected: " + socket.id + ", reason: " + reason);
  });

  socket.on("+play music", async () => { player.play(); });
  socket.on("+pause music", async () => { player.pause(); });
  socket.on("+stop music", async () => { player.stop(); });
  socket.on("+next song", async () => { player.next(); });
  socket.on("+prev song", async () => { player.prev(); });
  socket.on("+update list", async () => { player.updateList(); });
  socket.on("+get song", () => { console.log("Playing: " + player.getPlayingSong()); });
  socket.on("+enable filemon", () => { player.changeAutoUpdate(true); })
  socket.on("+disable filemon", () => { player.changeAutoUpdate(false); })
  socket.on("+enable autoplay", () => { player.changeAutoPlay(true); })
  socket.on("+disable autoplay", () => { player.changeAutoPlay(false); })


  loop = setInterval(() => {
    const random = Math.floor((Math.random() * 1300) + 1);
    // console.log(random);
    socket.emit("random", random); // Sends random number to client
  }, 3000);


  // Log every received message
  socket.onAny((event, ...message) => {
    // Log event for name of event, Log message for event data/message
    console.log(`got ${event}`);
   
    port.write(event+'\n', (err) => {
      if(err){
        return console.log('Error: ', err.message)
      }
    })
  });
});


io.on("disconnect", (socket) => {
  //no more connection to socket then stop
  stopStreaming();
})


function stopStreaming() {
  clearInterval(loop);
}


httpsServer.listen(4121);
httpServer.listen(4122);


io.attach(httpServer) // Weeb :3
io.attach(httpsServer)


function split_command(command) {
  var commandlist = command.split("_")


  var action = commandlist[0].replace(/[?!&-]/, "")
  var state = commandlist[1]


  if(action == "il"){
    action = "Indoor Lamp"
  }else if(action == 'ol'){
    action = "Outdoor Lamp"
  }else if(action == 'bz'){
    action = "Buzzer"
  }else if(action == 'dr'){
    action = "Door"
  }else if(action == 'fan'){
    action = "Fan"
  }else if(action == 're'){
    action = "Relay"
  }else if(action == 'wi'){
    action = "Window"
  }else{
    return 'error'
  }


  if(state == '1'){
    if(state in ['Window', 'Door']){
      state = 'Open'
    }else{
      state = 'On'
    }
  }else{
    if(state in ['Window', 'Door']){
      state = 'Closed'
    }else{
      state = 'Off'
    }
  }


  return [action, state]
}
