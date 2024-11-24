require('dotenv').config();
const WebSocket = require('ws');
const net = require('net');

process.on('uncaughtException', (err) => {
  console.error(err);
});

const remotehost = process.env.REMOTE_HOST;
const remoteport = process.env.REMOTE_PORT;
const password = process.env.REMOTE_PASSWORD;
const localhost = process.env.LOCAL_HOST || '0.0.0.0';
const localport = process.env.LOCAL_PORT || 4052;

if (!localhost || !localport || !remotehost || !remoteport || !password) {
  console.error('Error: periksa argumen Anda dan coba lagi!');
  process.exit(1);
}

const wss = new WebSocket.Server({ host: localhost, port: localport }, () => {
  console.log('Server WebSocket mendengarkan di %s:%d', localhost, localport);
  console.log('Mengarahkan ulang koneksi ke %s:%d', remotehost, remoteport);
});

wss.on('connection', (ws) => {
  console.log('Klien WebSocket terhubung');

  // Membuat koneksi ke server remote menggunakan TCP
  const remotesocket = new net.Socket();
  remotesocket.connect(remoteport, remotehost, () => {
    console.log('Terhubung ke server remote di %s:%d', remotehost, remoteport);
    remotesocket.write(password + '\n'); // Mengirimkan password untuk autentikasi
  });

  // Meneruskan data dari WebSocket ke soket remote
  ws.on('message', (message) => {
    console.log('Pesan dari klien:', message.toString());
    remotesocket.write(message);
  });

  // Meneruskan data dari soket remote ke WebSocket
  remotesocket.on('data', (data) => {
    console.log('Data dari remote:', data.toString());
    ws.send(data);
  });

  // Menangani kesalahan pada soket remote
  remotesocket.on('error', (err) => {
    console.error('Kesalahan pada soket remote: ', err.message);
    ws.close();
  });

  // Menangani penutupan soket remote
  remotesocket.on('close', () => {
    console.log('Soket remote ditutup');
    ws.close();
  });

  // Menangani penutupan WebSocket
  ws.on('close', () => {
    console.log('Klien WebSocket terputus');
    remotesocket.destroy();
  });

  // Menangani kesalahan pada WebSocket
  ws.on('error', (err) => {
    console.error('Kesalahan pada WebSocket: ', err.message);
    remotesocket.destroy();
  });
});
