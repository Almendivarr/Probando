
// API ChatGTP
const { Configuration, OpenAIApi } = require("openai");
const readlineSync = require("readline-sync");
require("dotenv").config();
// PDF
var pdf = require('html-pdf');

// Parser para html
const bodyParser = require('body-parser');

// SERVIDOR
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
//SERVIDOR
async function obtenerRespuesta(textos) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const history = [];
    
    const openai = new OpenAIApi(configuration);
    for (let i = 0; i < textos.length; i++) {
        console.log("Tamaño "+textos.length + " iteración = "+i  );
        const messages = [];
        messages.push({ role: "user", content: textos[i]});
        try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
        });

        const completion_text = completion.data.choices[0].message.content;
        console.log(completion_text);

        history.push( completion_text);
        }
        catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
        } 
    }
    var cuento = "";
    var capitulo = "";
    for (let i = 0; i < history.length; i++) {
        if(i > 2 ){
            console.log("Tamaño "+history.length + " iteración = "+i  );
            console.log(history[i]);
            capitulo = history[i].split(":");
            capitulo[0] = "";
            cap = "";
            for(let j = 0; j < capitulo.length; j++) {
                cap = cap + capitulo[j];
            }
            cuento = cuento + cap;
        }
    }
    crearPdf(cuento);
  };
  
function crearPdf(cuento) {
    cuento = "<html><body><h1>" +cuento + "</h1></body></html>";
    pdf.create(cuento).toFile('./salida.pdf', function(err, res) {
        if (err){
            console.log(err);
        } else {
            console.log(res);
        }
    });
};

function crearPreguntas(tematica, personajes) {
    const preguntas = [];
    var capitulos = 1;
    // preguntas.push("Quiero que actúes con el rol de escritor de cuentos infantiles profesional" );
    preguntas.push("Dime en 40 palabras la idea para un cuento infantil de temática"+tematica);
    preguntas.push("que personajes podría tener el cuento? ");
    preguntas.push("Genera un índice del cuento que tenga "+ capitulos+" capitulos con sus nombres ");
    preguntas.push("genera el capitulo 1 ");
    for (let i = 0; i < capitulos; i++) {
        if(i > 0 ){
            preguntas.push("genera el siguiente capitulo");
        }
    }
    obtenerRespuesta(preguntas);
};

app.get('/res', (req, res) => {
    
    textos = ["hola", "Adios"];
    obtenerRespuesta(textos);
});

app.post('/crearCuento', (req, res) => {
    var personajes =req.body.personajes;
    console.log(personajes);
    var tematica = req.body.tematica;
    console.log(tematica);
    crearPreguntas(tematica, personajes);
   // textos = ["hola", "Adios"];
   // obtenerRespuesta(textos);
});
app.get('/bienvenida', (req, res) => {
    res.sendFile(__dirname + '/public/cuentos.html');
});

app.get('/pdf', (req, res) => {
    var contenido = ` <h1>Esto es un test de html-pdf SegundoTest</h1> <p>Estoy generando PDF a partir de este código HTML sencillo</p>`;
    crearPdf(contenido);
   
});

app.get('/pdf2', (req, res) => {
    var contenido = ` as
    `;
    crearPdf(contenido);
   
});

app.get('/split', (req, res) => {
    history=[" blablalbalbla: capitulo1: hola que tal cap 1", "blaasdasdasdbla: capitulo2: hola es el cap 2"];
    var cuento = "";
    var capitulo = "";
    console.log("Tamaño "+history.length  );
    for (let i = 0; i < history.length; i++) {
        if(i > -1 ){
            console.log("Tamaño "+history.length + " iteración = "+i  );
            console.log(history[i]);
            capitulo = history[i].split(":");
            capitulo[0] = "";
            cap = "";
            for(let j = 0; j < capitulo.length; j++) {
                cap = cap + capitulo[j];
            }
            cuento = cuento + cap;
        }
    }
    crearPdf(cuento);
});

