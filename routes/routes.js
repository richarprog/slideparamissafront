const express = require("express");
const Services = require("../services/musicamissaServices");
const router = express.Router();


router.get("/", Services.BoasVindas);

router.get("/buscarEMostrar", (req, res) => {
  res.render("./musicas/BuscarEMostrar")
})


router.post("/addnalista", Services.adicionarMusicas);

router.post("/removerdalista", Services.RemoverDaLista);

//Cadastrar Músicas
router.get("/musicas/Cadastrar", (req, res) => {
  res.render("./musicas/Cadastrar"); 
});
router.post("/musicas/Cadastrar", Services.MusicaCreate);


//Buscar Músicas
router.get("/musicas/encontrar", (req, res) => {
  res.render("./musicas/Encontrar");  
});
router.get("/musicas", Services.MusicaMostrar);

//Criar Slide das Músicas
router.post("/criar", Services.CriarSlide);




module.exports = router;