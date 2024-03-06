// Parser para html
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const service = require('./service');
const serviceChat = require('./ServiceChat');
const multer = require('multer');
var usuarioLogeado;
const storage = multer.diskStorage({
  destination: 'public/productos',
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop(); // Obtener la extensión original del archivo
    cb(null, file.fieldname + '-' + Date.now() + '.' + ext); // Generar un nombre único con la extensión original
  }
});
var imagenUsuario;
const fs = require('fs');
const request = require('request');
const url = require('url');
// Usuario
var idUser = 0;
var productoPrueba;
var idProducto;
const upload = multer({ storage: storage });
//const ora = require('cli-spinners');
// SERVIDOR
const http = require('http');
const path = require('path');
const express = require('express');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const host = '0.0.0.0';
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'abcdefghijk', // Cambia esto por una cadena secreta más segura
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

//app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
server.listen(PORT, host, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
// Base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión establecida correctamente a la base de datos');
});

//                                                 INICIO ChAT
const users = {};

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  // Registrar el nuevo usuario
  socket.on('register', (data) => {
    const userId = data.userId;
    if (!users[userId]) {
      users[userId] = [];
    }
    users[userId].push(socket); // Añade el nuevo socket al array de sockets del usuario
    console.log(`Usuario ${userId} registrado con socket ID ${socket.id}`);
  });

  socket.on('solicitar historial', ({ fromUserId, toUserId }) => {
    // Suponiendo que tienes una función recuperarMensajes definida
    recuperarMensajes(fromUserId, toUserId, (error, mensajes) => {
      if (error) {
        console.error('Error al recuperar mensajes:', error);
        return;
      }
      // Envía los mensajes recuperados de vuelta al solicitante
      socket.emit('historial mensajes', mensajes);
    });
  });

  socket.on('private message', ({ content, toUserId, fromUserId }) => {
    console.log(toUserId);
    console.log(users);
    // Primero, guardar el mensaje en la base de datos
    serviceChat.guardarMensaje(fromUserId, toUserId, content, users);
});

  socket.on('cargar conversacion', ({ deUsuarioId, paraUsuarioId }) => {
    recuperarMensajes(deUsuarioId, paraUsuarioId, (error, mensajes) => {
      if (error) {
        socket.emit('error', { message: 'Error al recuperar mensajes.' });
        console.error(error);
      } else {
        socket.emit('historial mensajes', mensajes);
      }
    });
  });
  socket.on('disconnect', () => {
    // Elimina el socket desconectado de la lista de usuarios
    Object.keys(users).forEach(userId => {
      users[userId] = users[userId].filter(s => s !== socket);
      if (users[userId].length === 0) {
        delete users[userId]; // Elimina al usuario del objeto si no quedan sockets activos
      }
    });
    console.log('Usuario desconectado');
    console.log(users);
  });
});

function recuperarMensajes(fromUserId, toUserId, callback) {
  // Asegúrate de adaptar esta consulta a tu esquema de base de datos específico.
  // Por ejemplo, tu tabla podría tener diferentes nombres de columnas.
  const query = `
      SELECT * FROM mensajes
      WHERE (de_usuario_id = ? AND para_usuario_id = ?)
      OR (de_usuario_id = ? AND para_usuario_id = ?)
      ORDER BY timestamp ASC
  `;

  connection.query(query, [fromUserId, toUserId, toUserId, fromUserId], (error, results) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results);
    }
  });
}
//                                                 FIN DEL CHAT



app.get('/productos', (req, res) => {
  // Consulta SQL para obtener los productos de la base de datos
  service.productos(idUser, (err, productos) => {
    if (err) {
      return res.status(500).send('Error interno del servidor');
    }
    const imagenUsuario = idUser + '_imagen.jpg';
    res.render('index2.ejs', { productos: productos, imagenUser: imagenUsuario });
  });
});

app.get('/tipoProducto', requireLogin, (req, res) => {
  imagenUsuario = req.session.userId + "_imagen.jpg";
  res.render('tipoProducto.ejs', { imagenUser: imagenUsuario })
});

app.get('/producto/:id', (req, res) => {
  idProducto = req.params.id;
  service.obtenerProducto(idProducto, (error, productoData) => {
    if (error) {
      console.error('Error en obtenerProducto', error);
      return res.status(500).send('Error interno del servidor');
    }
    const rutaImagenes = __dirname;
    const imagenUsuario = req.session.userId + "_imagen.jpg";
    res.render('producto', { producto: productoData.producto, rutaImagenes: rutaImagenes, imagenUser: imagenUsuario, userProducto: productoData.usuario });
  });
});

app.post('/subirProducto', upload.single('imagen'), (req, res) => {
  const imagen = req.file;
  console.log('Imagen subida:', imagen);

  const nombre = req.body.nombre;
  const descripcion = req.body.descripcion;
  const precio = req.body.precio;
  const condicion = req.body.condicion;

  // Obtener el ID del usuario actual desde la sesión o cualquier otra fuente
  //const idUser = req.session.userId;

  // Llamar a la función subirProducto del servicio
  service.subirProducto(nombre, descripcion, precio, condicion, imagen.filename, idUser, (error, result) => {
    if (error) {
      return res.status(500).send('Error interno del servidor');
    }
    // Redireccionar o enviar una respuesta de éxito
    res.redirect('/'); // Puedes redireccionar a una página de éxito
  });
});


app.get('/', (req, res) => {
  res.redirect('/productos')
});

app.get('/inicio', (req, res) => {
  res.render('index.ejs')
});

app.get('/chat', (req, res) => {
  service.obtenerProductoPorId(idProducto, (error, producto) => {
    if (error) {
      console.error('Error al obtener el producto:', error);
      if (error === 'Producto no encontrado') {
        return res.status(404).send('Producto no encontrado');
      } else {
        return res.status(500).send('Error interno del servidor');
      }
    }
    service.obtenerUsuarioPorId(req.session.passport.user, (error, usr) => {
      const imagenUsuario = req.session.passport.user + "_imagen.jpg";
      res.render('chat.ejs', { usuario: usr, producto: producto, imagenUser: imagenUsuario });
    });
  });
});

app.get('/index', (req, res) => {
  if (req.session.loggedin == true) {
    res.redirect('/productos')
  }
  else {
    res.redirect("/logout")
  }

});

app.get('/misProductos', (req, res) => {
  if (req.session.loggedin == true) {
    //const idUsuario = req.session.userId; // Asegúrate de obtener el ID de usuario de alguna manera
    console.log(req.user);
    console.log(req.session);
    console.log(req.session.passport);
    console.log(req.session.passport.user);
    console.log(req.session.loggedin);
    console.log(req.session.userId);
    service.obtenerMisProductos(req.session.passport.user, (error, productos) => {
      if (error) {
        console.error('Error al obtener los productos:', error);
        return res.status(500).send('Error interno del servidor');
      }

      const imagenUsuario = req.session.userId + "_imagen.jpg";
      res.render('misProductos.ejs', { productos: productos, imagenUser: imagenUsuario });
    });
  } else {
    res.redirect("/logout");
  }
});

app.post('/borrar', (req, res) => {
  const productosSeleccionados = [].concat(req.body.producto_id || []);
  if (productosSeleccionados.length > 0) {
    //const idUsuario = req.session.userId; // Suponiendo que tienes el ID de usuario en la sesión

    service.borrarProductos(idUser, productosSeleccionados, (err, result) => {
      if (err) {
        console.error('Error al borrar los productos:', err);
        return res.status(500).send('Error interno del servidor');
      }
      res.redirect('/misProductos');
    });
  } else {
    res.send('No se seleccionó ningún producto para borrar.');
  }
});

app.get('/login', (req, res) => {
  res.render('login.ejs')
});

// GOogel auth
app.use(session({
  secret: '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',
  resave: false,
  saveUninitialized: true,
}));
// CLiente id 490922228138-jnjq5mht7vssdrd5s0ur2e1s7vpshs78.apps.googleusercontent.com



/*  PASSPORT SETUP  */
const passport = require('passport');
var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');


// Devuelve el index si el login ha sido aeptado o devuelve error si se ha puesto
// un usuario o contraseña erroneos
app.get('/success', (req, res) => {
  req.session.loggedin = true;
  imagenUsuario = req.session.userId + "_imagen.jpg";
  console.log(imagenUsuario);
  res.redirect('/');
});
app.get('/success', (req, res) => res.redirect('/'));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function (user, done) {
  done(null, user.id); // Guarda solo el ID del usuario en la sesión
});

passport.deserializeUser(function (id, done) {
  // Utiliza tu función de servicio para buscar al usuario por ID
  service.obtenerUsuarioPorId(id, function (error, usuario) {
    if (error) {
      console.error('Error al deserializar el usuario:', error);
      return done(error, null);
    }

    // Verifica si se encontraron resultados
    if (!usuario) {
      console.log('Usuario no encontrado con el ID:', id);
      return done(null, false); // O maneja este caso como prefieras
    }

    // Retorna el usuario encontrado
    done(null, usuario);
  });
});

/*  Google AUTH  */

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
GOOGLE_CLIENT_ID = '504088933313-jdtp2uodtiadufm5ieedbqqo2fr46ljh.apps.googleusercontent.com';
GOOGLE_CLIENT_SECRET = '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';
//const GOOGLE_CLIENT_ID = '490922228138-jnjq5mht7vssdrd5s0ur2e1s7vpshs78.apps.googleusercontent.com';
//const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true
},
  // Creamos el id usuario y recogemos su nombre en dos variables
  function (req, accessToken, refreshToken, profile, done) {
    userProfile = profile;
    userLogin = userProfile.name.givenName;
    idUser = userProfile.id;
    usuarioLogeado = userProfile;
    //req.session.userId = idUser;
    console.log(req.session.userId + " y mas " + idUser);
    //req.session.userLogin = userLogin;
    //req.session.usuarioLogeado = profile;
    //req.session.save();
    console.log("id del usuario " + idUser);
    // Realizar una query buscando si el id del usuario está en la base de datos
    //connection.query(`use usuarios`, function (err, result) {
    //});

    service.obtenerUsuarioPorId(idUser, (error, usuario) => {
      if (error) {
        console.error('Error al obtener el usuario:', error);
        // Aquí puedes manejar el error, por ejemplo, devolver un error 500 al cliente
        return done(error);
      }

      // Si el usuario no existe, lo insertas en la base de datos
      if (!usuario) {
        // Insertas el nuevo usuario en la base de datos
        service.insertarUsuario(idUser, userLogin, userProfile, (error, nuevoUsuario) => {
          console.log("Dentro del insert")
          if (error) {
            console.error('Error al insertar el usuario:', error);
            // Aquí también puedes manejar el error, por ejemplo, devolver un error 500
            return done(error);
          }

          console.log('Usuario insertado correctamente:', nuevoUsuario);
          // Guardar la imagen del usuario si se insertó correctamente
          if (userProfile.photos && userProfile.photos.length > 0) {
            const userImage = userProfile.photos[0].value;
            guardarImagen(nuevoUsuario.id, userImage);
          }

          // Finalmente, retornas el userProfile
          return done(null, userProfile);
        });
      } else {
        // Si el usuario ya existe, simplemente retornas el userProfile
        return done(null, userProfile);
      }
    });
  })
);


// Devuelve la página de para logearse en google
app.post('/iniciarSesion',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// Devuelve la página de para logearse en google
app.get('/iniciarSesion',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  function (req, res) {
    // Successful authentication, redirect success.
    res.setHeader('Cache-Control', 'no-cache');
    res.redirect('/success');
  });

// Elimina las variables de usuario
app.post("/cerrarSesion", (req, res) => {
  idUser = 0;
  userLogin = "";
  res.setHeader('Cache-Control', 'no-cache');
  res.redirect("/logout");
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    // Consulta SQL para obtener los productos de la base de datos
    const sql = 'SELECT * FROM producto';

    // Ejecutar la consulta SQL
    connection.query(sql, (err, result) => {
      if (err) {
        console.error('Error al obtener los productos:', err);
        return res.status(500).send('Error interno del servidor');
      }
      // Renderizar la plantilla EJS con los datos de los productos

      res.render('logout.ejs', { productos: result, imagenUser: imagenUsuario });
    });
  });
});

function requireLogin(req, res, next) {
  if (req.session.loggedin) {
    next(); // Continúa con la siguiente ruta si el usuario está autenticado
  } else {
    res.redirect('/login'); // Redirecciona al usuario al formulario de inicio de sesión si no está autenticado
  }
}