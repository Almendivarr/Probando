const url = require('url');
const mysql = require('mysql');
const fs = require('fs');
const request = require('request');
const path = require('path');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prueba'
});

function guardarMensaje(fromUserId, toUserId, content, users) {
    const query = 'INSERT INTO mensajes (de_usuario_id, para_usuario_id, mensaje) VALUES (?, ?, ?)';
    connection.query(query, [fromUserId, toUserId, content], (error, results) => {
        if (error) {
            return console.error('Error al guardar el mensaje:', error);
        }
        console.log('Mensaje guardado con ID:', results.insertId);

        // Verifica si el usuario destinatario está conectado
        if (users[toUserId]) {
            // El usuario está conectado, enviar el mensaje a todos sus sockets
            users[toUserId].forEach(userSocket => {
                userSocket.emit('private message', {
                    content,
                    fromUserId
                });
            });
        } else {
            // Aquí puedes manejar el caso cuando el usuario no está conectado
            // Por ejemplo, podrías guardar el mensaje en una tabla diferente para "mensajes pendientes"
            console.log('El destinatario no está conectado; el mensaje se ha almacenado para ser entregado más tarde.');
        }
    });
}

module.exports = {
    guardarMensaje: guardarMensaje
};