const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

require('dotenv').config(); // Importa las variables de entorno desde el archivo .env

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

module.exports = {
  getResponse,
};

async function getResponse(prompt) {
  const response = await openai.createCompletion({
    prompt: prompt,
    temperature: 0.7,
    n: 1,
    stop: '\n',
    stream: false,
    model: 'gpt-3.5-turbo' 
  });
  console.log("PRueba");
  console.log(response.data.choices[0].text.trim());
  return response.data.choices[0].text.trim();
}

app.get('/chat', (req, res) => {
  res.send(getResponse("Hola"));
});

app.get('/chat2', (req, res) => {
  example();
});

import { ChatGPTAPI } from 'chatgpt'

async function example() {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const res = await api.sendMessage('Hello World!')
  console.log(res.text)
}
/* 
model: 'gpt-3.5-turbo', // Replace with your desired GPT model
prompt,
temperature: 0.5,
n: 1,
stop: '\n',*/