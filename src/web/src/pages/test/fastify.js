import Fastify from "fastify";
import websocket from "@fastify/websocket";

const app = Fastify();

await app.register(websocket);

app.get("/ws", { websocket: true }, (connection /* SocketStream */, req) => {
  console.log("Client connected");

  const interval = setInterval(() => {
    const payload = {
      type: "usage",
      payload: {
        time: new Date().toLocaleTimeString(),
        value: 70 + Math.random() * 25,
      },
    };

    connection.socket.send(JSON.stringify(payload));
  }, 1000);

  connection.socket.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

app.listen({ port: 3000 });

const connect = () => {
  // ✅ FIX 1: dùng ws:// + đúng path /ws
  let ws = new WebSocket("ws://localhost:3001/ws");

  ws.onopen = () => {
    console.log("WS Connected 🚀");
  };

  ws.onmessage = (event) => {
    try {
      const incoming = JSON.parse(event.data);

      setData((prev) => {
        const next = [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            value: incoming.value,
          },
        ];

        // giữ max points
        if (next.length > MAX_POINTS) next.shift();

        return next;
      });
    } catch (err) {
      console.error("Parse error:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("WS Error:", err);
  };

  // ✅ FIX 2: auto reconnect
  ws.onclose = () => {
    console.log("WS Closed → reconnecting...");
    setTimeout(connect, 2000);
  };
};

connect();
