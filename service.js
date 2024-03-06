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


function productos(idUser, callback) {
    const sql = 'SELECT * FROM producto WHERE usuario != ? OR usuario IS NULL';

    // Ejecutar la consulta SQL
    connection.query(sql, [idUser], (err, result) => {
        if (err) {
            console.error('Error al obtener los productos:', err);
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

// Obteiene el producto y el usuario que le corresponde
function obtenerProducto(productId, callback) {
    obtenerProductoPorId(productId, (error, producto) => {
        if (error) {
            console.error('Error al obtener el producto:', error);
            return callback(error, null);
        }

        obtenerUsuarioPorId(producto.Usuario, (error, usuario) => {
            if (error) {
                console.error('Error al obtener el usuario del producto:', error);
                return callback(error, null);
            }

            const productoData = {
                producto: producto,
                usuario: usuario
            };
            callback(null, productoData);
        });
    });
}

// Select del usuario por id
function obtenerUsuarioPorId(idUsuario, callback) {
    const sqlUsuario = 'SELECT * FROM usuarios WHERE id = ?';
    connection.query(sqlUsuario, [idUsuario], (error, usuarioResults) => {
        if (error) {
            console.error('Error al obtener el usuario:', error);
            return callback(error, null);
        }
        // Verifica si se encontraron resultados
        if (usuarioResults.length === 0) {
            return callback(usuarioResults[0], null);
        }
        // Retorna el usuario encontrado
        callback(null, usuarioResults[0]);
    });
}

// Insert de un producto
function subirProducto(nombre, descripcion, precio, condicion, imagen, idUser, callback) {
    // Ejecutar una consulta SQL para insertar los datos en la base de datos
    const sql = `INSERT INTO producto (nombre, descripcion, precio, condicion, imagen, usuario) VALUES (?, ?, ?, ?, ?, ?)`;
    connection.query(sql, [nombre, descripcion, precio, condicion, imagen, idUser], (err, result) => {
        if (err) {
            console.error('Error al insertar el producto en la base de datos:', err);
            return callback(err, null);
        }
        console.log('Producto insertado correctamente en la base de datos');
        callback(null, result);
    });
}

//Select de un producto especifico
function obtenerProductoPorId(idProducto, callback) {
    const sql = 'SELECT * FROM producto WHERE id = ?';
    connection.query(sql, [idProducto], (error, results) => {
        if (error) {
            console.error('Error al realizar la consulta:', error);
            return callback(error, null);
        }

        // Verifica si se encontraron resultados
        if (results.length === 0) {
            return callback('Producto no encontrado', null);
        }

        const producto = results[0];
        callback(null, producto);
    });
}

//Select de los productos del usuario logeado
function obtenerMisProductos(idUsuario, callback) {
    const sql = 'SELECT * FROM producto WHERE usuario = ? OR usuario IS NULL';
    connection.query(sql, [idUsuario], (error, results) => {
        if (error) {
            console.error('Error al obtener los productos:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
}

//Hace un select de los productos seleccionados para eliminar la imagen y un delete para eliminarlos de la base de datos
function borrarProductos(idUsuario, productosSeleccionados, callback) {
    const sqlDelete = 'DELETE FROM producto WHERE id IN (?) AND usuario = ?';
    const sqlSelect = 'SELECT * FROM producto WHERE id IN (?) AND usuario = ?';

    connection.query(sqlSelect, [productosSeleccionados, idUsuario], (err, result) => {
        if (err) {
            console.error('Error al borrar los productos:', err);
            return callback(err, null);
        }
        result.forEach(producto => {
            const rutaImagen = `${__dirname}/public/productos/${producto.imagen}`;
            fs.unlink(rutaImagen, (err) => {
                if (err) {
                    console.error('Error al eliminar la imagen:', err);
                    return;
                }
                console.log('Imagen eliminada correctamente:', producto.imagen);
            });
        });
        connection.query(sqlDelete, [productosSeleccionados, idUsuario], (err, result) => {
            if (err) {
                console.error('Error al borrar los productos:', err);
                return callback(err, null);
            }
            console.log(`Productos borrados: ${result.affectedRows}`);
            callback(null, result);
        });
    });
};

// Insertar un nuevo usuario en la base de datos
function insertarUsuario(idUsuario, userLogin, userProfile, done) {
    const sql = 'INSERT INTO usuarios (id, nombre) VALUES (?, ?)';
    connection.query(sql, [idUsuario, userLogin], (error, result) => {
        if (error) {
            console.error('Error al insertar el usuario:', error);
            return done(error, null);
        }
        console.log('Usuario insertado correctamente:', result);
        // Guardar la imagen del usuario si se insertó correctamente
        if (userProfile.photos && userProfile.photos.length > 0) {
            const userImage = userProfile.photos[0].value;
            guardarImagen(idUsuario, userImage);
        }
        // Devuelve el userProfile después de insertar el nuevo usuario
        return done(null, userProfile);
    });
};


function guardarImagen(idUsuario, urlImagen) {
    // Ruta donde se guardará la imagen en el servidor
    const directorioImagenes = path.join(__dirname, '/public/imagenesUsuario');

    // Verificar si el directorio existe, si no existe, crearlo
    if (!fs.existsSync(directorioImagenes)) {
        fs.mkdirSync(directorioImagenes);
    }

    // Obtener la extensión del archivo de la URL de la imagen
    const extension = path.extname(url.parse(urlImagen).pathname);

    // Crear un nombre de archivo único para la imagen
    const nombreArchivo = `${idUsuario}_imagen.jpg`;
    const rutaArchivo = path.join(directorioImagenes, nombreArchivo);

    // Descargar la imagen desde la URL y guardarla en el servidor
    request(urlImagen).pipe(fs.createWriteStream(rutaArchivo))
        .on('close', function () {
            console.log(`Imagen guardada en el servidor: ${rutaArchivo}`);
        })
        .on('error', function (err) {
            console.error('Error al guardar la imagen:', err);
        });
};

module.exports = {
    obtenerProducto, productos,
    subirProducto, obtenerProductoPorId,
    obtenerMisProductos, borrarProductos,
    obtenerUsuarioPorId, insertarUsuario
};