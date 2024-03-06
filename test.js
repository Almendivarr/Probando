const service = require('./service');
const mysql = require('mysql');
const fs = require('fs');
const { createConnection } = require('net');

// Simula la librería de mysql como lo hiciste
jest.mock('mysql', () => ({
    createConnection: jest.fn().mockReturnThis(),
    query: jest.fn((sql, values, callback) => {
        if (sql.includes('SELECT * FROM usuarios')) {
            // Simular la respuesta para SELECT * FROM usuarios
            return callback(null, [{ id: 1, nombre: 'Usuario 1' }]);
        } else if (sql.includes('SELECT * FROM mensajes')) {
            // Simular la respuesta para SELECT * FROM mensajes
            return callback(null, [{ id: 1, contenido: 'Mensaje 1' }]);
        } else if (sql.includes('INSERT INTO')) {
            // Simular la inserción exitosa
            return callback(null, { affectedRows: 1 });
        } else if (sql.includes('DELETE FROM')) {
            // Simular la eliminación exitosa
            return callback(null, { affectedRows: 1 });
        } else if (sql.includes('SELECT * FROM producto WHERE usuario = ?')) {
            // Por defecto, simular la respuesta para otras consultas
            console.log("entrando en select rpoduyctos where where user");
            return callback(null, [{ id: 5, nombre: 'Producto 5' }]);
        } else if (sql.includes('SELECT * FROM producto ')) {
            console.log("entrando en select rpoduyctos");
            // Por defecto, simular la respuesta para otras consultas
            return callback(null, [{ id: 1, nombre: 'Producto 1' }]);
        }

    })
}));

describe('productos service', () => {
    test('debería obtener productos de otros usuarios correctamente(productos)', done => {
        const idUser = 1;
        service.productos(idUser, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual([{ id: 1, nombre: 'Producto 1' }]);
            done();
        });
    });

    test('debería obtener un producto según su id(obtenerProductoPorId)', done => {
        const idProducto = 1;
        service.obtenerProductoPorId(idProducto, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ id: 1, nombre: 'Producto 1' });
            done();
        });
    });

    test('debería obtener productos del mismo usuario(obtenerMisProductos)', done => {
        const idUser = 5;
        service.obtenerMisProductos(idUser, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual([{ id: 5, nombre: 'Producto 5' }]);
            done();
        });
    });

    test('debería subir un producto correctamente(subirProducto)', done => {
        const nombre = 'Producto de prueba';
        const descripcion = 'Descripción del producto';
        const precio = 10.99;
        const condicion = 'Nueva';
        const imagen = 'imagen.jpg';
        const idUsuario = 1;

        service.subirProducto(nombre, descripcion, precio, condicion, imagen, idUsuario, (err, result) => {
            expect(err).toBeNull();
            // Verificar que se haya insertado el producto correctamente
            expect(result).toBeTruthy();

            // Luego podrías añadir más expectativas para verificar que el producto se ha insertado correctamente en la base de datos
            // Por ejemplo, podrías hacer una consulta para obtener el producto recién insertado y comparar sus atributos con los que se pasaron como parámetros

            done();
        });
    });
});

describe('test de usuario', () => {

    test('debería subir un usuario(subirProducto)', done => {
        const id = 555;
        const nombre = 'Usuario 1';

        service.subirProducto(nombre, descripcion, precio, condicion, imagen, idUsuario, (err, result) => {
            expect(err).toBeNull();
            // Verificar que se haya insertado el producto correctamente
            expect(result).toBeTruthy();

            // Luego podrías añadir más expectativas para verificar que el producto se ha insertado correctamente en la base de datos
            // Por ejemplo, podrías hacer una consulta para obtener el producto recién insertado y comparar sus atributos con los que se pasaron como parámetros

            done();
        });
    });
    test('debería obtener un usuario por su id (obtenerUsuarioPorId)', done => {
        const idUsuario = 1;
        service.obtenerUsuarioPorId(idUsuario, (err, usuario) => {
            expect(err).toBeNull();
            expect(usuario).toEqual({ id: 1, nombre: 'Usuario 1' });
            done();
        });
    });
});

describe('test de obtenerProducto', () => {
    test('debería obtener un producto y su usuario correspondiente (obtenerProducto)', done => {
        const productId = 1;
        const expectedProduct = { id: 1, nombre: 'Producto 1' };
        const expectedUser = { id: 1, nombre: 'Usuario 1' };

        // Mock de las consultas a la base de datos para obtener el producto y el usuario
        // Suponiendo que se espera que obtenerProductoPorId devuelva el producto esperado
        service.obtenerProductoPorId = jest.fn((id, callback) => {
            // Simulación de la llamada a obtenerProductoPorId
            callback(null, expectedProduct);
        });

        // Suponiendo que se espera que obtenerUsuarioPorId devuelva el usuario esperado
        service.obtenerUsuarioPorId = jest.fn((id, callback) => {
            // Simulación de la llamada a obtenerUsuarioPorId
            callback(null, expectedUser);
        });

        // Llamada a la función a probar
        service.obtenerProducto(productId, (err, productoData) => {
            // Verificar que no haya errores
            expect(err).toBeNull();

            // Verificar que el producto y el usuario devueltos sean los esperados
            expect(productoData.producto).toEqual(expectedProduct);
            expect(productoData.usuario).toEqual(expectedUser);

            done(); // Indicar que el test ha finalizado
        });
    });
});

describe('test de borrarProductos', () => {
    test('debería borrar los productos correctamente', done => {
        // Definir datos de prueba
        const idUsuario = 1;
        const productosSeleccionados = [1, 2, 3]; // Supongamos que estos son los IDs de los productos seleccionados

        // Mock de las consultas a la base de datos
        const mockResultSelect = [{ id: 1, imagen: 'imagen1.jpg' }, { id: 2, imagen: 'imagen2.jpg' }, { id: 3, imagen: 'imagen3.jpg' }];
        const mockResultDelete = { affectedRows: 3 };

        // Mock de fs.unlink para simular la eliminación de imágenes
        const mockUnlink = jest.spyOn(fs, 'unlink').mockImplementation((path, callback) => {
            callback(null);
        });

        // Llamada a la función a probar
        service.borrarProductos(idUsuario, productosSeleccionados, (err, result) => {
            // Verificar que no haya errores
            expect(err).toBeNull();



            // Verificar que se haya llamado a fs.unlink para cada imagen de producto seleccionado
            expect(mockUnlink).toHaveBeenCalledTimes(productosSeleccionados.length);

            // Verificar que se haya llamado a fs.unlink con las rutas de imagen correctas
            productosSeleccionados.forEach(productoId => {
                const rutaImagen = `${__dirname}/public/productos/imagen${productoId}.jpg`;
                expect(mockUnlink).toHaveBeenCalledWith(rutaImagen, expect.any(Function));
            });

            // Verificar que se haya llamado a la función de consulta de eliminación con los parámetros correctos
            expect(connection.query).toHaveBeenCalledWith(
                'DELETE FROM producto WHERE id IN (?) AND usuario = ?',
                [productosSeleccionados, idUsuario],
                expect.any(Function)
            );

            // Verificar que se haya llamado a la función de callback con el resultado esperado
            expect(result).toEqual(mockResultDelete);

            done(); // Indicar que el test ha finalizado
        });
    });
});

describe('guardarImagen', () => {
    beforeAll(() => {
        // Crear un directorio temporal para las imágenes
        fs.mkdirSync(path.join(__dirname, '/temp'));
    });

    afterAll(() => {
        // Eliminar el directorio temporal y su contenido después de las pruebas
        fs.rmdirSync(path.join(__dirname, '/temp'), { recursive: true });
    });

    test('debería guardar la imagen correctamente', done => {
        const idUsuario = 1;
        const urlImagen = 'https://example.com/imagen.jpg';

        // Mockear la escritura de la imagen en el servidor
        const writeStreamMock = jest.fn();
        fs.createWriteStream = jest.fn(() => ({
            pipe: jest.fn().mockReturnThis(),
            on: writeStreamMock
        }));

        // Llamar a la función
        service.guardarImagen(idUsuario, urlImagen);

        // Verificar si la imagen se escribió correctamente en el archivo
        setTimeout(() => {
            // Construir la ruta donde se espera que se guarde la imagen
            const directorioImagenes = path.join(__dirname, '/public/imagenesUsuario');
            const nombreArchivo = `${idUsuario}_imagen.jpg`;
            const rutaArchivo = path.join(directorioImagenes, nombreArchivo);

            expect(fs.createWriteStream).toHaveBeenCalledWith(rutaArchivo);
            done();
        }, 1000); // Esperar un segundo para dar tiempo a que se escriba la imagen
    });
});