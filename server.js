const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 在线用户
const users = new Map();

io.on('connection', (socket) => {
  console.log('新连接:', socket.id);

  // 用户加入
  socket.on('join', (username) => {
    users.set(socket.id, username);
    console.log(`${username} 加入了聊天室`);

    // 通知所有人
    io.emit('system', {
      text: `${username} 加入了聊天室`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
    // 更新在线人数
    io.emit('online', users.size);
  });

  // 收到消息
  socket.on('message', (data) => {
    const username = users.get(socket.id) || '匿名';
    io.emit('message', {
      id: socket.id,
      username: username,
      text: data.text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 正在输入
  socket.on('typing', () => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('typing', username);
    }
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('stopTyping');
  });

  // 断开连接
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      console.log(`${username} 离开了聊天室`);
      users.delete(socket.id);
      io.emit('system', {
        text: `${username} 离开了聊天室`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      });
      io.emit('online', users.size);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`聊天服务器运行在端口 ${PORT}`);
});
