import { Server } from "socket.io";

const io = new Server(1234);

io.on("connection", (socket) => {
  // If this message is received then do something
  socket.on("open door", (...args) => {
    console.log("Door opened xd")
  })

  setInterval(() => {
    const random = Math.floor((Math.random() * 1300) + 1)
    console.log(random)
    socket.emit("random", random) // Sends random number to client
  }, 3000)
})