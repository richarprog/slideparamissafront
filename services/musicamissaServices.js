const axios = require("axios");
const pptxgen = require("pptxgenjs");
const cheerio = require('cheerio');
const path = require('path');
var musicasEscolhidas = []
const estrofes = []
var numeroMusica = 1

module.exports = class Services {
//Renderizar página Home
  static async BoasVindas(req, res){
    musicasEscolhidas = []
    numeroMusica = 1
    console.log(numeroMusica);
    const mensagemInicial = "Bem vindo ao sistema de criação de slides de músicas"  
    res.render("./Home", {mensagemInicial});  
  }

  // Criar música no banco de dados
  static async MusicaCreate(req, res) {
    try {
      let valores = req.body;
      const options = {
        url: 'https://api-dbmusicas-RicharlisomSouz.replit.app/cadastrar',
        method: 'POST',
        data: valores
      };

      // Aguarde a resposta da chamada axios
      const response = await axios(options);

      const mensagem = "Cadastro realizado com sucesso!";
      res.render("mensagem", { mensagem });
    } catch (error) {
      console.error("Erro ao cadastrar a música:", error);
      res.status(500).send("Erro ao cadastrar a música.");
    }
  }
  
  
  static async MusicaMostrar(req, res) {
    try {
      // Obtenha as palavras-chave da consulta
      const palavrasChave = req.query.palavrasChave;

      // Verifique se as palavras-chave foram fornecidas
      if (!palavrasChave) {
        return res.status(400).send("Por favor, forneça palavras-chave para a busca.");
      }

      const options = {
        url: `https://api-dbmusicas-RicharlisomSouz.replit.app/musica?palavrasChave=${palavrasChave}`,
        method: 'GET',
      };

      // Aguarde a resposta da chamada axios
      const response = await axios(options);

      // Verifique o tipo de conteúdo retornado
      const contentType = response.headers['content-type'];
      
      if (contentType.includes('text/html')) {        
        const htmlContent = response.data;  
        
        const musicas = htmlContent.match(/<li>.*?<\/li>/gs);

        const mensagem = "Músicas Encontradas"
        
         
        res.render("./musicas/Encontrar", {mensagem, musicas, musicasEscolhidas}); // "sua_template" é o nome do seu arquivo de modelo/template
        
      } else {
        const data = response.data;
        res.render("mostrar", { data }); 
        console.log("O arquivo é outro");        
      }    

    } catch (error) {
      console.error("Erro ao buscar a música:", error);
      const mensagem = "Nenhuma Música Encontrada"
      res.render("./musicas/Encontrar", {mensagem, musicasEscolhidas});
    }
  }



  static async adicionarMusicas(req, res) {
    try {
        const musicaEscolhida = req.body.musicas;
        const $ = cheerio.load(musicaEscolhida);

        // Adicionar um sufixo ou prefixo único aos IDs das estrofes e refrão
        // let numeroMusica = 1// Substitua isso com o número da música dinamicamente
        $('[id^=estrofe]').attr('id', function(i, oldId) {
            return oldId + '_musica' + numeroMusica;
        });
        $('#refrao').attr('id', 'refrao_musica' + numeroMusica);
        $('#titulo').attr('id', 'titulo_musica' + numeroMusica);
        

        const musicaModificada = $.html();
        console.log(musicaModificada);

        musicasEscolhidas.push(musicaModificada);
        numeroMusica++      

      res.render("./musicas/Encontrar", {musicasEscolhidas});      

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao adicionar músicas." });
    }
}

static async RemoverDaLista(req, res) {
  let indexMusicaARemover = req.body.musicaEscolhida;
  if (indexMusicaARemover >= 0 && indexMusicaARemover < musicasEscolhidas.length) {
    musicasEscolhidas.splice(indexMusicaARemover, 1); // Remove a música no índice especificado
  }
res.render('./musicas/Encontrar', {musicasEscolhidas});
}

static async CriarSlide(req, res) {
  try {
    // Recebendo o html    
    let musicasEscolhidas = [];
    musicasEscolhidas = req.body.musicasEscolhidas;
    const musicas = musicasEscolhidas.match(/<html>.*?<\/html>/gs);
    console.log(musicas.length);
    console.log(musicas)

    // Criar apresentação
    let apresentacao = new pptxgen();
    apresentacao.theme = { bodyFontFace: "Arial" };

    // Iterar sobre cada música
    musicas.forEach((musicaHtml, index) => {
      const $ = cheerio.load(musicaHtml);
      const estrofes = [];
      const refrao = $(`#refrao_musica${index + 1}`).text().trim();  // Índice começa de 1
      const titulo = $(`#titulo_musica${index + 1}`).text().trim(); // Obtendo o título da música

      // Coletar estrofes
      for (let i = 1; i <= musicas.length; i++) {
        const estrofe = $(`#estrofe${i}_musica${index + 1}`).text();  // Índice começa de 1
        if (estrofe) {
          estrofes.push(estrofe);
          if (refrao) {
            estrofes.push(refrao);  // Adicionar refrão após cada estrofe
          }
        }
      }

      console.log("Estrofes", estrofes)
      console.log("refraos", refrao)

      // Adicionar slides para título, estrofes e refrão
      estrofes.forEach((conteudo, i) => {
        let slide = apresentacao.addSlide();
        slide.color = "255255255";
        slide.background = { color: "000000"}
        if (i === 0) {
          // Adicionar o título da música no primeiro slide da música
          slide.addText(titulo, {
            x: 1.5,
            y: 0.5,
            fontSize: 24,  // Tamanho da fonte para o título
            color: "FF0000",  // Cor do texto do título
            align: apresentacao.AlignH.center
          });
        }

        slide.addText(conteudo, {
          x: 1.5,
          y: 2.5,
          fontSize: 24,
          color: "F5FFFA",
          fill: { color: "F1F1F1" },
          align: apresentacao.AlignH.center
        });
      });
    });


    // Gere o arquivo PPTX no servidor
    const pptxFilePath = path.join(__dirname, "../arquivos", `ArquivoPronto.pptx`);
    apresentacao.writeFile(pptxFilePath);

    musicasEscolhidas = [];
    

    // Envie o arquivo PPTX como resposta para download
    setTimeout(() => {
      res.setHeader('Content-Disposition', `attachment; filename="ArquivoPronto.pptx"`);
      res.sendFile(pptxFilePath);
    }, 200);
  } catch (error) {
    console.error("Erro ao criar o slide:", error);
    const mensagem = "Erro ao criar o arquivo.\nProvalvelmente você não escolheu as músicas de forma correta."
    res.status(500).render("mensagem", {mensagem});
  }
}
};