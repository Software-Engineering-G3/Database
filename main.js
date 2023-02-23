import { Server } from "socket.io";

// Bypass CORS policy
const io = new Server(1234, {
  cors: {
    origin: '*'
  }
});

io.on("connection", (socket) => {

  // Log when client connects
  console.log("Client connected");

  // If this message is received then do something
  socket.on("open door", (...args) => {
    console.log("Door opened xd");
  });

  setInterval(() => {
    const random = Math.floor((Math.random() * 1300) + 1);
    // console.log(random);
    socket.emit("random", random); // Sends random number to client
  }, 3000);

  // Log every received message
  socket.onAny((event, ...args) => {
    console.log(`got ${event}`);
  });

});