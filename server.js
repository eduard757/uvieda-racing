const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let llavesActivas = ["REF123"]; 

io.on('connection', (socket) => {
    socket.on('auth-juego', ({ tiktokUser, referencia }) => {
        if (llavesActivas.includes(referencia)) {
            console.log(`🔎 Buscando Live de: ${tiktokUser}...`);
            iniciarCarrera(socket, tiktokUser);
        } else {
            socket.emit('error-auth', 'Llave inválida');
        }
    });
});

function iniciarCarrera(socket, tiktokUser) {
    // Configuración optimizada para evitar bloqueos
    let connection = new WebcastPushConnection(tiktokUser, {
        enableWebsocketUpgrade: true,
        requestOptions: { timeout: 10000 },
        clientParams: { "app_language": "es-MX", "device_platform": "web" }
    });

    connection.connect().then(state => {
        console.log(`🚀 ¡CONECTADO CON ÉXITO! Usuario: ${tiktokUser}`);
        socket.emit('update-game', { corredores: {} });

        connection.on('gift', (data) => {
            socket.emit('update-game', { regalo: data });
        });

    }).catch(err => {
        console.log(`❌ Error: ${err.message}. ¿Estás usando el @usuario correcto?`);
        socket.emit('error-auth', `No se encontró el Live. Revisa tu ID de usuario.`);
    });
}

server.listen(3000, () => {
    console.log('🚀 SERVIDOR UVIEDA PRO LISTO');
});