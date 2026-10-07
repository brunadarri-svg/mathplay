/* =========================================
   LOGIN
========================================= */

const formLogin = document.getElementById("formLogin");

formLogin.addEventListener("submit", function(event) {

    event.preventDefault();

    entrarMathZone();

});


function entrarMathZone() {

    const email = document.getElementById("emailLogin").value.trim();
    const senha = document.getElementById("senhaLogin").value.trim();

    const mensagem = document.getElementById("mensagemLogin");

    if (email === "" || senha === "") {

        mensagem.textContent = "⚠️ Preencha o e-mail e a senha.";
        mensagem.className = "mensagem-login erro";

        return;
    }


    if (!email.includes("@")) {

        mensagem.textContent = "⚠️ Digite um e-mail válido.";
        mensagem.className = "mensagem-login erro";

        return;
    }


    mensagem.textContent = "🎉 Login realizado! Entrando...";
    mensagem.className = "mensagem-login sucesso";


    localStorage.setItem("mathzoneEmail", email);


    setTimeout(function() {

        document.getElementById("telaLogin").style.display = "none";

        document
            .getElementById("sitePrincipal")
            .classList.add("visivel");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }, 700);

}


/* =========================================
   MOSTRAR SENHA
========================================= */

function mostrarSenha() {

    const senha = document.getElementById("senhaLogin");

    if (senha.type === "password") {

        senha.type = "text";

    } else {

        senha.type = "password";

    }

}


/* =========================================
   CRIAR CONTA
========================================= */

function criarConta() {

    const email = document.getElementById("emailLogin");

    email.focus();

    alert(
        "🧡 Para este projeto, você pode preencher seu e-mail e criar uma senha para entrar no MathZone!"
    );

}


/* =========================================
   SAIR
========================================= */

function sair() {

    localStorage.removeItem("mathzoneEmail");

    document.getElementById("sitePrincipal").classList.remove("visivel");

    document.getElementById("telaLogin").style.display = "flex";

    document.getElementById("emailLogin").value = "";
    document.getElementById("senhaLogin").value = "";

}


/* =========================================
   NAVEGAÇÃO
========================================= */

function irPara(tela) {

    document.querySelectorAll(".tela").forEach(function(secao) {

        secao.classList.remove("ativa");

    });


    const destino = document.getElementById(tela);

    if (destino) {

        destino.classList.add("ativa");

        if (tela === "ranking") {
            atualizarRanking();
        }

        if (tela === "pets") {
            atualizarPets();
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

}


/* =========================================
   RANKING
========================================= */

const chaveRanking = "mathzoneRanking";


function obterRanking() {

    try {

        const rankingSalvo = JSON.parse(localStorage.getItem(chaveRanking) || "[]");

        if (!Array.isArray(rankingSalvo)) {
            return [];
        }

        return rankingSalvo
            .filter(function(jogador) {
                return jogador && typeof jogador.email === "string" && Number.isFinite(jogador.pontos);
            })
            .sort(function(a, b) {
                return b.pontos - a.pontos;
            });

    } catch (erro) {

        return [];

    }

}


function registrarPontuacao(pontos) {

    const email = (localStorage.getItem("mathzoneEmail") || "").trim().toLowerCase();

    if (!email) {
        return;
    }

    const ranking = obterRanking();
    const jogador = ranking.find(function(item) {
        return item.email === email;
    });

    if (jogador) {
        jogador.pontos += pontos;
    } else {
        ranking.push({ email: email, pontos: pontos });
    }

    localStorage.setItem(chaveRanking, JSON.stringify(ranking));

}


function criarItemPodio(jogador, posicao) {

    const item = document.createElement("div");
    item.className = "podio-jogador " + posicao;

    const medalha = document.createElement("span");
    medalha.className = "medalha-ranking";
    medalha.textContent = posicao === "primeiro" ? "🥇" : posicao === "segundo" ? "🥈" : "🥉";

    const nome = document.createElement("strong");
    nome.textContent = jogador.email.split("@")[0];

    const pontos = document.createElement("span");
    pontos.textContent = jogador.pontos + " pontos";

    item.append(medalha, nome, pontos);
    return item;

}


function atualizarRanking() {

    const ranking = obterRanking();
    const podio = document.getElementById("podioRanking");
    const demais = document.getElementById("demaisRanking");
    const lista = document.getElementById("listaRanking");

    podio.innerHTML = "";
    lista.innerHTML = "";

    if (ranking.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "ranking-vazio";
        vazio.textContent = "Ainda não há pontuações. Termine um jogo para aparecer no ranking!";
        podio.appendChild(vazio);
        demais.hidden = true;
        return;
    }

    if (ranking[1]) podio.appendChild(criarItemPodio(ranking[1], "segundo"));
    podio.appendChild(criarItemPodio(ranking[0], "primeiro"));
    if (ranking[2]) podio.appendChild(criarItemPodio(ranking[2], "terceiro"));

    ranking.slice(3).forEach(function(jogador, indice) {
        const item = document.createElement("li");
        const nome = document.createElement("strong");
        nome.textContent = (indice + 4) + ". " + jogador.email.split("@")[0];

        const pontos = document.createElement("span");
        pontos.textContent = jogador.pontos + " pontos";

        item.append(nome, pontos);
        lista.appendChild(item);
    });

    demais.hidden = ranking.length <= 3;

}


/* =========================================
   LOJA DE PETS
========================================= */

const chaveContasPets = "mathzoneContasPets";
const catalogoPets = [
    { id: "coelho", nome: "Pipoca", especie: "Coelhinho", emoji: "🐰", custo: 30, descricao: "Adora cenouras e desafios rápidos." },
    { id: "gato", nome: "Luna", especie: "Gatinha", emoji: "🐱", custo: 50, descricao: "Curiosa, esperta e pronta para aprender." },
    { id: "raposa", nome: "Faísca", especie: "Raposa", emoji: "🦊", custo: 80, descricao: "Uma companheira veloz para novas conquistas." },
    { id: "dragao", nome: "Pixel", especie: "Dragão", emoji: "🐉", custo: 120, descricao: "Um dragão raro que ama resolver enigmas." }
];


function carregarContaPets() {

    const email = (localStorage.getItem("mathzoneEmail") || "").trim().toLowerCase();

    if (!email) {
        return null;
    }

    let contas = {};

    try {
        const contasSalvas = JSON.parse(localStorage.getItem(chaveContasPets) || "{}");

        if (contasSalvas && typeof contasSalvas === "object" && !Array.isArray(contasSalvas)) {
            contas = contasSalvas;
        }
    } catch (erro) {
        contas = {};
    }

    if (!contas[email] || typeof contas[email] !== "object") {
        contas[email] = { pontos: 0, colecao: [], petAtivo: null };
    }

    const perfil = contas[email];

    if (!Number.isFinite(perfil.pontos)) {
        perfil.pontos = 0;
    }

    if (!Array.isArray(perfil.colecao)) {
        perfil.colecao = [];
    }

    perfil.colecao = perfil.colecao.filter(function(id) {
        return catalogoPets.some(function(pet) {
            return pet.id === id;
        });
    });

    if (!perfil.colecao.includes(perfil.petAtivo)) {
        perfil.petAtivo = null;
    }

    return { email: email, contas: contas, perfil: perfil };

}


function salvarContasPets(contas) {
    localStorage.setItem(chaveContasPets, JSON.stringify(contas));
}


function registrarPontosPet(pontos) {

    const dados = carregarContaPets();

    if (!dados) {
        return;
    }

    dados.perfil.pontos += pontos;
    salvarContasPets(dados.contas);
    atualizarPets();

}


function criarElementoPet(pet, classe) {

    const ilustracao = document.createElement("div");
    ilustracao.className = classe;
    ilustracao.textContent = pet.emoji;
    ilustracao.setAttribute("aria-hidden", "true");

    return ilustracao;

}


function atualizarPets() {

    const dados = carregarContaPets();
    const saldo = document.getElementById("saldoPets");
    const total = document.getElementById("totalPets");
    const destaque = document.getElementById("petAtivo");
    const loja = document.getElementById("lojaPets");
    const colecao = document.getElementById("colecaoPets");

    loja.innerHTML = "";
    colecao.innerHTML = "";

    const pontos = dados ? dados.perfil.pontos : 0;
    const petsAdotados = dados ? dados.perfil.colecao : [];
    const petAtivo = dados
        ? catalogoPets.find(function(pet) {
            return pet.id === dados.perfil.petAtivo;
        })
        : null;

    saldo.textContent = pontos + " pts";
    total.textContent = petsAdotados.length + (petsAdotados.length === 1 ? " pet" : " pets");

    destaque.innerHTML = "";

    if (petAtivo) {
        destaque.appendChild(criarElementoPet(petAtivo, "pet-destaque-emoji"));

        const textoDestaque = document.createElement("div");
        textoDestaque.className = "pet-destaque-texto";

        const etiqueta = document.createElement("span");
        etiqueta.textContent = "SEU COMPANHEIRO";

        const nome = document.createElement("h3");
        nome.textContent = petAtivo.nome + " · " + petAtivo.especie;

        const descricao = document.createElement("p");
        descricao.textContent = petAtivo.descricao;

        textoDestaque.append(etiqueta, nome, descricao);
        destaque.appendChild(textoDestaque);
    } else {
        destaque.classList.add("pet-destaque-vazio");

        const vazio = document.createElement("p");
        vazio.textContent = "Seu primeiro companheiro está esperando por você. Junte pontos e escolha um pet na loja.";
        destaque.appendChild(criarElementoPet({ emoji: "🐾" }, "pet-destaque-emoji"));
        destaque.appendChild(vazio);
    }

    if (petAtivo) {
        destaque.classList.remove("pet-destaque-vazio");
    }

    catalogoPets.forEach(function(pet) {
        const adotado = petsAdotados.includes(pet.id);
        const cartao = document.createElement("article");
        cartao.className = "pet-card";

        const cabecalho = document.createElement("div");
        cabecalho.className = "pet-card-cabecalho";
        cabecalho.appendChild(criarElementoPet(pet, "pet-card-emoji"));

        const especie = document.createElement("span");
        especie.className = "pet-especie";
        especie.textContent = pet.especie;
        cabecalho.appendChild(especie);

        const nome = document.createElement("h4");
        nome.textContent = pet.nome;

        const descricao = document.createElement("p");
        descricao.textContent = pet.descricao;

        const rodape = document.createElement("div");
        rodape.className = "pet-card-rodape";

        const custo = document.createElement("strong");
        custo.textContent = pet.custo + " pts";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = adotado ? "Já adotado" : "Adotar pet";
        botao.disabled = adotado;
        botao.onclick = function() {
            comprarPet(pet.id);
        };

        rodape.append(custo, botao);
        cartao.append(cabecalho, nome, descricao, rodape);
        loja.appendChild(cartao);
    });

    if (petsAdotados.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "colecao-vazia";
        vazio.textContent = "Sua coleção ainda está vazia. Acerte perguntas para ganhar pontos e fazer sua primeira adoção.";
        colecao.appendChild(vazio);
        return;
    }

    petsAdotados.forEach(function(id) {
        const pet = catalogoPets.find(function(item) {
            return item.id === id;
        });

        if (!pet) {
            return;
        }

        const cartao = document.createElement("article");
        cartao.className = "pet-colecao-item";
        cartao.appendChild(criarElementoPet(pet, "pet-colecao-emoji"));

        const nome = document.createElement("strong");
        nome.textContent = pet.nome;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = dados.perfil.petAtivo === id ? "Equipado" : "Usar pet";
        botao.disabled = dados.perfil.petAtivo === id;
        botao.onclick = function() {
            equiparPet(id);
        };

        cartao.append(nome, botao);
        colecao.appendChild(cartao);
    });

}


function comprarPet(id) {

    const pet = catalogoPets.find(function(item) {
        return item.id === id;
    });
    const dados = carregarContaPets();
    const mensagem = document.getElementById("mensagemPets");

    if (!pet || !dados) {
        return;
    }

    if (dados.perfil.colecao.includes(id)) {
        mensagem.textContent = "Esse pet já faz parte da sua coleção.";
        return;
    }

    if (dados.perfil.pontos < pet.custo) {
        mensagem.textContent = "Faltam " + (pet.custo - dados.perfil.pontos) + " pontos. Acerte mais perguntas para adotar " + pet.nome + ".";
        return;
    }

    dados.perfil.pontos -= pet.custo;
    dados.perfil.colecao.push(id);
    dados.perfil.petAtivo = id;
    salvarContasPets(dados.contas);

    mensagem.textContent = pet.nome + " foi adotado e já está com você!";
    atualizarPets();

}


function equiparPet(id) {

    const dados = carregarContaPets();
    const pet = catalogoPets.find(function(item) {
        return item.id === id;
    });

    if (!dados || !pet || !dados.perfil.colecao.includes(id)) {
        return;
    }

    dados.perfil.petAtivo = id;
    salvarContasPets(dados.contas);
    document.getElementById("mensagemPets").textContent = pet.nome + " agora é seu companheiro ativo!";
    atualizarPets();

}


/* =========================================
   MODAL
========================================= */

function abrirModal(jogo) {

    const modal = document.getElementById("modalJogo");

    document.querySelectorAll(".jogo-area").forEach(function(area) {

        area.classList.remove("ativo");

    });


    document.getElementById(jogo).classList.add("ativo");

    modal.classList.add("ativo");

}


function fecharJogo() {

    if (estadoCorrida.status === "running") {
        estadoCorrida.sprintAtivo = false;
        estadoCorrida.status = "paused";
        cancelAnimationFrame(estadoCorrida.frame);
        estadoCorrida.frame = null;
        atualizarPainelCorrida();
    }

    document
        .getElementById("modalJogo")
        .classList.remove("ativo");

}


/* =========================================
   QUIZ
========================================= */

const perguntasQuiz = [

    {
        pergunta: "Quanto é 5 + 3?",
        respostas: ["6", "7", "8", "9"],
        correta: "8"
    },

    {
        pergunta: "Quanto é 10 - 4?",
        respostas: ["4", "5", "6", "7"],
        correta: "6"
    },

    {
        pergunta: "Quanto é 3 × 4?",
        respostas: ["7", "10", "12", "14"],
        correta: "12"
    },

    {
        pergunta: "Quanto é 20 ÷ 5?",
        respostas: ["2", "3", "4", "5"],
        correta: "4"
    },

    {
        pergunta: "Quanto é 7 + 6?",
        respostas: ["11", "12", "13", "14"],
        correta: "13"
    }

];


let perguntaAtualQuiz = 0;
let pontosQuiz = 0;


function abrirQuiz() {

    perguntaAtualQuiz = 0;
    pontosQuiz = 0;

    document.getElementById("pontos").textContent = "Pontos: 0";

    document.getElementById("resultadoQuiz").textContent = "";

    abrirModal("quiz");

    mostrarPerguntaQuiz();

}


function mostrarPerguntaQuiz() {

    if (perguntaAtualQuiz >= perguntasQuiz.length) {

        document.getElementById("perguntaQuiz").textContent =
            "🎉 Parabéns! Você terminou!";

        document.getElementById("respostasQuiz").innerHTML = "";

        document.getElementById("resultadoQuiz").textContent =
            "⭐ Você fez " + pontosQuiz + " pontos!";

        registrarPontuacao(pontosQuiz);

        return;
    }


    const pergunta = perguntasQuiz[perguntaAtualQuiz];


    document.getElementById("perguntaQuiz").textContent =
        pergunta.pergunta;


    const respostas =
        document.getElementById("respostasQuiz");

    respostas.innerHTML = "";


    pergunta.respostas.forEach(function(resposta) {

        const botao = document.createElement("button");

        botao.type = "button";

        botao.textContent = resposta;

        botao.onclick = function() {

            verificarQuiz(resposta);

        };

        respostas.appendChild(botao);

    });

}


function verificarQuiz(resposta) {

    const pergunta = perguntasQuiz[perguntaAtualQuiz];

    if (resposta === pergunta.correta) {

        pontosQuiz += 10;

        document.getElementById("pontos").textContent =
            "Pontos: " + pontosQuiz;

        document.getElementById("resultadoQuiz").textContent =
            "🎉 Muito bem! +10 pts para adotar um pet!";

        registrarPontosPet(10);

    } else {

        document.getElementById("resultadoQuiz").textContent =
            "💡 Quase! Continue tentando!";

    }


    perguntaAtualQuiz++;


    setTimeout(function() {

        document.getElementById("resultadoQuiz").textContent = "";

        mostrarPerguntaQuiz();

    }, 700);

}


/* =========================================
   DETETIVE MATEMÁTICO
========================================= */

const perguntasDetetive = [

    {
        pergunta: "🕵️ O primeiro mistério: 6 + 6 = ?",
        resposta: 12
    },

    {
        pergunta: "🔎 Segundo mistério: 5 × 5 = ?",
        resposta: 25
    },

    {
        pergunta: "🕵️ Último mistério: 6 × 6 = ?",
        resposta: 36
    }

];


let detetiveAtual = 0;
let pontosDetetive = 0;


function abrirDetetive() {

    detetiveAtual = 0;
    pontosDetetive = 0;

    document.getElementById("pontosDetetive").textContent =
        "Pontos: 0";

    document.getElementById("resultadoDetetive").textContent = "";

    document.getElementById("respostaDetetive").value = "";
    document.getElementById("respostaDetetive").style.display = "block";
    document.querySelector("#detetive .botao-jogo").style.display = "inline-block";

    abrirModal("detetive");

    mostrarDetetive();

}


function mostrarDetetive() {

    if (detetiveAtual >= perguntasDetetive.length) {

        document.getElementById("perguntaDetetive").textContent =
            "🏆 Mistério resolvido!";

        document.getElementById("respostaDetetive").style.display =
            "none";

        document.querySelector("#detetive .botao-jogo").style.display =
            "none";

        document.getElementById("resultadoDetetive").textContent =
            "⭐ Você conseguiu " + pontosDetetive + " pontos!";

        registrarPontuacao(pontosDetetive);

        return;
    }


    document.getElementById("perguntaDetetive").textContent =
        perguntasDetetive[detetiveAtual].pergunta;

}


function responderDetetive() {

    const campo =
        document.getElementById("respostaDetetive");

    const valor = Number(campo.value);


    if (campo.value.trim() === "") {

        document.getElementById("resultadoDetetive").textContent =
            "✏️ Digite uma resposta.";

        return;

    }


    const correta =
        perguntasDetetive[detetiveAtual].resposta;


    if (valor === correta) {

        pontosDetetive += 10;

        document.getElementById("pontosDetetive").textContent =
            "Pontos: " + pontosDetetive;

        document.getElementById("resultadoDetetive").textContent =
            "🎉 Acertou! +10 pts para adotar um pet!";

        registrarPontosPet(10);

    } else {

        document.getElementById("resultadoDetetive").textContent =
            "❌ Essa não é a resposta. Tente novamente!";

        return;

    }


    campo.value = "";

    detetiveAtual++;


    setTimeout(function() {

        document.getElementById("resultadoDetetive").textContent = "";

        mostrarDetetive();

    }, 700);

}


/* =========================================
   CORRIDA DE RUA
========================================= */

const distanciaMetaCorrida = 400;
const chaveRecordesCorrida = "mathzoneRecordesCorrida";
const chaveColecaoTenisCorrida = "mathzoneColecaoTenisCorrida";
const estadoCorrida = {
    status: "ready",
    distancia: 0,
    segundos: 0,
    folego: 100,
    faixa: 1,
    velocidadeAtual: 0,
    picoVelocidade: 0,
    sprintAtivo: false,
    puloAte: 0,
    obstaculos: [],
    bonus: [],
    proximoObstaculo: 78,
    proximoBonus: 56,
    proximoCheckpoint: 100,
    questaoAtual: null,
    ultimaFrame: 0,
    frame: null,
    itensColetados: 0,
    recompensaRegistrada: false,
    recorde: null
};

const questoesCorrida = [
    { pergunta: "75 + 25 = ?", respostas: ["90", "100", "110"], correta: "100" },
    { pergunta: "180 + 20 = ?", respostas: ["180", "190", "200"], correta: "200" },
    { pergunta: "3 × 100 = ?", respostas: ["300", "250", "350"], correta: "300" }
];

const premiosTenisCorrida = [
    { id: "adidas-adios-pro", marca: "adidas", modelo: "Adizero Adios Pro 4", categoria: "Velocidade", meta: 25, imagem: "./assets/tenis/adidas-corrida-cinza.jpg", fonte: "Pexels" },
    { id: "nike-pegasus-feminino", marca: "Nike", modelo: "Pegasus · feminino", categoria: "Feminino", meta: 25.5, imagem: "./assets/tenis/nike-feminino-coral.jpg", fonte: "Pexels" },
    { id: "adidas-supernova-feminino", marca: "adidas", modelo: "Supernova · feminino", categoria: "Feminino", meta: 26, imagem: "./assets/tenis/adidas-feminino-corrida.jpg", fonte: "Pexels" },
    { id: "nike-vaporfly", marca: "Nike", modelo: "ZoomX Vaporfly 3", categoria: "Velocidade", meta: 27, imagem: "./assets/tenis/nike-corrida-vermelho.jpg", fonte: "Unsplash" },
    { id: "adidas-adios-evo", marca: "adidas", modelo: "Adizero Adios Pro Evo 1", categoria: "Velocidade", meta: 29, imagem: "./assets/tenis/adidas-corrida-branco.jpg", fonte: "Pexels" },
    { id: "nike-alphafly", marca: "Nike", modelo: "Air Zoom Alphafly 3", categoria: "Velocidade", meta: 30.5, imagem: "./assets/tenis/nike-corrida-claro.jpg", fonte: "Unsplash" }
];

const canvasCorrida = document.getElementById("corridaCanvas");
const contextoCorrida = canvasCorrida.getContext("2d");


function carregarRecordeCorrida() {

    try {
        const recordes = JSON.parse(localStorage.getItem(chaveRecordesCorrida) || "{}");
        const email = (localStorage.getItem("mathzoneEmail") || "").trim().toLowerCase();
        return email && Number.isFinite(recordes[email]) ? recordes[email] : null;
    } catch (erro) {
        return null;
    }

}


function salvarRecordeCorrida(segundos) {

    const email = (localStorage.getItem("mathzoneEmail") || "").trim().toLowerCase();

    if (!email) return false;

    try {
        const recordes = JSON.parse(localStorage.getItem(chaveRecordesCorrida) || "{}");
        const recordeAnterior = Number.isFinite(recordes[email]) ? recordes[email] : Infinity;

        if (segundos >= recordeAnterior) return false;

        recordes[email] = segundos;
        localStorage.setItem(chaveRecordesCorrida, JSON.stringify(recordes));
        return true;
    } catch (erro) {
        return false;
    }

}


function formatarTempoCorrida(segundos) {

    const minutos = Math.floor(segundos / 60).toString().padStart(2, "0");
    const restante = Math.floor(segundos % 60).toString().padStart(2, "0");
    return minutos + ":" + restante;

}


function ajustarCanvasCorrida() {

    const alturaDesejada = window.matchMedia("(max-width: 700px)").matches
        ? Math.round(canvasCorrida.width * 0.75)
        : 400;

    if (canvasCorrida.height !== alturaDesejada) {
        canvasCorrida.height = alturaDesejada;
    }

}


window.addEventListener("resize", function() {
    if (document.getElementById("corrida").classList.contains("ativo")) {
        ajustarCanvasCorrida();
        desenharCorrida(performance.now());
    }
});


function criarIlustracaoTenis(tenis) {

    const foto = document.createElement("img");
    foto.className = "tenis-premio-imagem";
    foto.src = tenis.imagem;
    foto.alt = "Foto ilustrativa de um tênis " + tenis.marca + " para a recompensa " + tenis.modelo;
    foto.loading = "lazy";
    foto.decoding = "async";
    return foto;

}


function carregarPerfilTenisCorrida() {

    const email = (localStorage.getItem("mathzoneEmail") || "").trim().toLowerCase();

    if (!email) return null;

    let contas = {};
    try {
        const salvo = JSON.parse(localStorage.getItem(chaveColecaoTenisCorrida) || "{}");
        if (salvo && typeof salvo === "object" && !Array.isArray(salvo)) {
            contas = salvo;
        }
    } catch (erro) {
        contas = {};
    }

    const perfil = contas[email] && typeof contas[email] === "object"
        ? contas[email]
        : { colecao: [], equipado: null };

    if (!Array.isArray(perfil.colecao)) perfil.colecao = [];
    perfil.colecao = perfil.colecao.filter(function(id) {
        return premiosTenisCorrida.some(function(tenis) {
            return tenis.id === id;
        });
    });

    if (!perfil.colecao.includes(perfil.equipado)) perfil.equipado = null;

    return { email: email, contas: contas, perfil: perfil };

}


function salvarPerfilTenisCorrida(dados) {

    if (!dados) return false;

    try {
        dados.contas[dados.email] = dados.perfil;
        localStorage.setItem(chaveColecaoTenisCorrida, JSON.stringify(dados.contas));
        return true;
    } catch (erro) {
        return false;
    }

}


function criarCartaoTenisCorrida(tenis, statusTexto, botaoTexto, desativado, progresso, acao) {

    const cartao = document.createElement("article");
    cartao.className = "tenis-premio" + (desativado ? " bloqueado" : " desbloqueado");
    cartao.appendChild(criarIlustracaoTenis(tenis));

    const marca = document.createElement("span");
    marca.className = "tenis-premio-marca";
    marca.textContent = tenis.marca + " · " + tenis.categoria;

    const modelo = document.createElement("strong");
    modelo.textContent = tenis.modelo;

    const meta = document.createElement("span");
    meta.className = "tenis-premio-meta";
    meta.textContent = tenis.meta.toFixed(1).replace(".", ",") + " km/h de média";

    const status = document.createElement("span");
    status.className = "tenis-premio-status";
    status.textContent = statusTexto;

    const notaFoto = document.createElement("span");
    notaFoto.className = "tenis-premio-foto-nota";
    notaFoto.textContent = "Foto real ilustrativa · " + tenis.fonte + ". Prêmio digital.";

    const barra = document.createElement("div");
    barra.className = "tenis-premio-progresso";
    barra.setAttribute("aria-label", "Progresso até a recompensa");
    const preenchimento = document.createElement("span");
    preenchimento.style.width = Math.min(progresso, 100) + "%";
    barra.appendChild(preenchimento);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = botaoTexto;
    botao.disabled = desativado;
    if (acao) botao.onclick = acao;

    cartao.append(marca, modelo, meta, status, notaFoto, barra, botao);
    return cartao;

}


function atualizarVitrineTenis() {

    const vitrine = document.getElementById("galeriaTenisCorrida");
    const equipadoElemento = document.getElementById("tenisEquipadoCorrida");
    const colecaoElemento = document.getElementById("colecaoTenisCorrida");
    const melhorMedia = estadoCorrida.recorde ? 1440 / estadoCorrida.recorde : 0;
    const melhorMediaTexto = document.getElementById("melhorMediaTenisCorrida");
    const dados = carregarPerfilTenisCorrida();
    const colecao = dados ? dados.perfil.colecao : [];
    const tenisEquipado = datosTenisEquipado(dados);

    melhorMediaTexto.textContent = melhorMedia > 0
        ? melhorMedia.toFixed(1).replace(".", ",") + " km/h"
        : "complete uma prova";
    vitrine.innerHTML = "";
    equipadoElemento.innerHTML = "";
    colecaoElemento.innerHTML = "";

    if (tenisEquipado) {
        equipadoElemento.appendChild(criarIlustracaoTenis(tenisEquipado));

        const nomeEquipado = document.createElement("strong");
        nomeEquipado.textContent = tenisEquipado.marca + " " + tenisEquipado.modelo;

        const etiquetaEquipado = document.createElement("span");
        etiquetaEquipado.textContent = "EM USO";
        equipadoElemento.append(nomeEquipado, etiquetaEquipado);
    } else {
        const vazio = document.createElement("p");
        vazio.className = "tenis-equipado-vazio";
        vazio.textContent = "Escolha um tênis depois de desbloquear seu primeiro prêmio.";
        equipadoElemento.appendChild(vazio);
    }

    if (colecao.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "colecao-tenis-vazia";
        vazio.textContent = "Sua coleção começa quando você atingir a velocidade média de uma recompensa.";
        colecaoElemento.appendChild(vazio);
    }

    premiosTenisCorrida.forEach(function(tenis) {
        const desbloqueado = melhorMedia >= tenis.meta;
        const resgatado = colecao.includes(tenis.id);
        const emUso = dados && dados.perfil.equipado === tenis.id;
        const textoBotao = resgatado
            ? emUso ? "Selecionado" : "Equipar"
            : desbloqueado ? "Resgatar prêmio" : "Bloqueado";
        const statusTexto = resgatado
            ? emUso ? "Tênis equipado" : "Na sua coleção"
            : desbloqueado ? "Prêmio liberado" : "Meta " + tenis.meta.toFixed(1).replace(".", ",") + " km/h";

        const cartao = criarCartaoTenisCorrida(
            tenis,
            statusTexto,
            textoBotao,
            !desbloqueado || emUso,
            melhorMedia / tenis.meta * 100,
            resgatado
                ? function() { selecionarTenisCorrida(tenis.id); }
                : function() { resgatarTenisCorrida(tenis.id); }
        );

        vitrine.appendChild(cartao);

        if (resgatado) {
            colecaoElemento.appendChild(criarCartaoTenisCorrida(
                tenis,
                emUso ? "Tênis selecionado" : "Prêmio conquistado",
                emUso ? "Selecionado" : "Selecionar",
                emUso,
                100,
                function() { selecionarTenisCorrida(tenis.id); }
            ));
        }
    });

}


function datosTenisEquipado(dados) {

    if (!dados || !dados.perfil.equipado) return null;

    return premiosTenisCorrida.find(function(tenis) {
        return tenis.id === dados.perfil.equipado;
    }) || null;

}


function resgatarTenisCorrida(id) {

    const tenis = premiosTenisCorrida.find(function(item) {
        return item.id === id;
    });
    const dados = carregarPerfilTenisCorrida();
    const melhorMedia = estadoCorrida.recorde ? 1440 / estadoCorrida.recorde : 0;

    if (!tenis || !dados || melhorMedia < tenis.meta) return;

    if (!dados.perfil.colecao.includes(id)) {
        dados.perfil.colecao.push(id);
    }

    if (!salvarPerfilTenisCorrida(dados)) {
        document.getElementById("mensagemCorrida").textContent =
            "Não foi possível salvar a coleção neste navegador.";
        return;
    }

    document.getElementById("mensagemCorrida").textContent =
        tenis.marca + " " + tenis.modelo + " resgatado para sua coleção digital.";
    atualizarVitrineTenis();

}


function selecionarTenisCorrida(id) {

    const tenis = premiosTenisCorrida.find(function(item) {
        return item.id === id;
    });
    const dados = carregarPerfilTenisCorrida();

    if (!tenis || !dados || !dados.perfil.colecao.includes(id)) return;

    dados.perfil.equipado = id;

    if (!salvarPerfilTenisCorrida(dados)) {
        document.getElementById("mensagemCorrida").textContent =
            "Não foi possível salvar a seleção neste navegador.";
        return;
    }

    document.getElementById("mensagemCorrida").textContent =
        tenis.marca + " " + tenis.modelo + " selecionado para sua próxima corrida.";
    atualizarVitrineTenis();

}


function atualizarPainelCorrida() {

    document.getElementById("corridaDistancia").innerHTML =
        Math.min(Math.floor(estadoCorrida.distancia), distanciaMetaCorrida) + " <small>/ 400 m</small>";
    document.getElementById("corridaTempo").textContent = formatarTempoCorrida(estadoCorrida.segundos);
    document.getElementById("corridaFolego").textContent = Math.ceil(estadoCorrida.folego) + "%";
    document.getElementById("corridaBarra").style.width =
        Math.min(estadoCorrida.distancia / distanciaMetaCorrida * 100, 100) + "%";

    const recorde = estadoCorrida.recorde;
    document.getElementById("corridaRecorde").textContent = recorde === null
        ? "—"
        : formatarTempoCorrida(recorde);
    const velocidadeAtual = estadoCorrida.status === "running" ? estadoCorrida.velocidadeAtual : 0;
    document.getElementById("corridaVelocidade").textContent =
        velocidadeAtual.toFixed(1).replace(".", ",") + " km/h";
    document.getElementById("corridaPico").textContent =
        estadoCorrida.picoVelocidade.toFixed(1).replace(".", ",") + " km/h";

    const rodando = estadoCorrida.status === "running";
    const pausada = estadoCorrida.status === "paused";
    const aguardandoResposta = estadoCorrida.status === "question";
    const terminou = estadoCorrida.status === "finished" || estadoCorrida.status === "failed";
    const botaoIniciar = document.getElementById("botaoIniciarCorrida");
    const botaoPausar = document.getElementById("botaoPausarCorrida");

    botaoIniciar.hidden = rodando || aguardandoResposta;
    botaoIniciar.textContent = pausada ? "Retomar corrida" : terminou ? "Tentar de novo" : "Começar corrida";
    botaoPausar.hidden = !rodando && !pausada;
    botaoPausar.textContent = pausada ? "Retomar" : "Pausar";

}


function abrirCorrida() {

    if (estadoCorrida.frame) cancelAnimationFrame(estadoCorrida.frame);

    Object.assign(estadoCorrida, {
        status: "ready",
        distancia: 0,
        segundos: 0,
        folego: 100,
        faixa: 1,
        velocidadeAtual: 0,
        picoVelocidade: 0,
        sprintAtivo: false,
        puloAte: 0,
        obstaculos: [],
        bonus: [],
        proximoObstaculo: 78,
        proximoBonus: 56,
        proximoCheckpoint: 100,
        questaoAtual: null,
        ultimaFrame: 0,
        frame: null,
        itensColetados: 0,
        recompensaRegistrada: false,
        recorde: carregarRecordeCorrida()
    });

    ajustarCanvasCorrida();
    document.getElementById("checkpointMatematico").hidden = true;
    atualizarVitrineTenis();
    document.getElementById("mensagemCorrida").textContent =
        "Escolha uma faixa e prepare-se para sua primeira volta.";
    atualizarPainelCorrida();
    desenharCorrida();
    abrirModal("corrida");

}


function iniciarCorrida() {

    if (estadoCorrida.status === "running") return;

    if (estadoCorrida.status === "finished" || estadoCorrida.status === "failed") {
        abrirCorrida();
    }

    estadoCorrida.status = "running";
    estadoCorrida.ultimaFrame = performance.now();
    document.getElementById("mensagemCorrida").textContent =
        "Boa prova! Desvie dos cones ou pule no momento certo.";
    atualizarPainelCorrida();
    estadoCorrida.frame = requestAnimationFrame(atualizarCorrida);

}


function alternarPausaCorrida() {

    if (estadoCorrida.status === "running") {
        estadoCorrida.status = "paused";
        document.getElementById("mensagemCorrida").textContent =
            "Prova pausada. Retome quando estiver pronto.";
        atualizarPainelCorrida();
        desenharCorrida();
    } else if (estadoCorrida.status === "paused") {
        iniciarCorrida();
    }

}


function moverCorredor(direcao) {

    if (estadoCorrida.status !== "running") return;
    estadoCorrida.faixa = Math.max(0, Math.min(2, estadoCorrida.faixa + direcao));

}


function pularObstaculo() {

    if (estadoCorrida.status !== "running") return;
    estadoCorrida.puloAte = performance.now() + 820;

}


function definirSprint(ativo) {

    estadoCorrida.sprintAtivo = Boolean(ativo) &&
        estadoCorrida.status === "running" &&
        estadoCorrida.folego > 0;

}


function gerarElementosCorrida() {

    while (estadoCorrida.proximoObstaculo < estadoCorrida.distancia + 72) {
        estadoCorrida.obstaculos.push({
            distancia: estadoCorrida.proximoObstaculo,
            faixa: Math.floor(Math.random() * 3),
            resolvido: false
        });
        estadoCorrida.proximoObstaculo += 46 + Math.random() * 12;
    }

    while (estadoCorrida.proximoBonus < estadoCorrida.distancia + 72) {
        estadoCorrida.bonus.push({
            distancia: estadoCorrida.proximoBonus,
            faixa: Math.floor(Math.random() * 3),
            coletado: false
        });
        estadoCorrida.proximoBonus += 72 + Math.random() * 18;
    }

}


function abrirCheckpointCorrida() {

    const indice = Math.floor(estadoCorrida.proximoCheckpoint / 100) - 1;
    const questao = questoesCorrida[indice];

    if (!questao) return;

    estadoCorrida.sprintAtivo = false;
    estadoCorrida.status = "question";
    estadoCorrida.questaoAtual = questao;
    document.getElementById("etiquetaCheckpoint").textContent =
        "PORTAL MATEMÁTICO · " + estadoCorrida.proximoCheckpoint + " M";
    document.getElementById("perguntaCheckpoint").textContent = questao.pergunta;

    const respostas = document.getElementById("respostasCheckpoint");
    respostas.innerHTML = "";

    questao.respostas.forEach(function(resposta) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = resposta;
        botao.onclick = function() {
            responderCheckpointCorrida(resposta);
        };
        respostas.appendChild(botao);
    });

    document.getElementById("checkpointMatematico").hidden = false;
    document.getElementById("mensagemCorrida").textContent =
        "Portal fechado: resolva a conta para continuar a prova.";
    atualizarPainelCorrida();
    desenharCorrida(performance.now());

}


function responderCheckpointCorrida(resposta) {

    if (estadoCorrida.status !== "question" || !estadoCorrida.questaoAtual) return;

    if (resposta !== estadoCorrida.questaoAtual.correta) {
        estadoCorrida.segundos += 5;
        estadoCorrida.folego = Math.max(0, estadoCorrida.folego - 12);
        document.getElementById("mensagemCorrida").textContent =
            "Ainda não. Você perdeu 5 segundos e 12% de fôlego. Tente outra resposta.";

        if (estadoCorrida.folego <= 0) {
            document.getElementById("checkpointMatematico").hidden = true;
            concluirCorrida(false);
            return;
        }

        atualizarPainelCorrida();
        return;
    }

    estadoCorrida.folego = Math.min(100, estadoCorrida.folego + 8);
    estadoCorrida.proximoCheckpoint += 100;
    estadoCorrida.questaoAtual = null;
    estadoCorrida.status = "running";
    estadoCorrida.ultimaFrame = performance.now();
    document.getElementById("checkpointMatematico").hidden = true;
    document.getElementById("mensagemCorrida").textContent =
        "Conta certa! +10 pontos e o portal está aberto. Continue correndo.";

    registrarPontuacao(10);
    registrarPontosPet(10);
    atualizarPainelCorrida();
    desenharCorrida(estadoCorrida.ultimaFrame);
    estadoCorrida.frame = requestAnimationFrame(atualizarCorrida);

}


function atualizarCorrida(tempoAtual) {

    if (estadoCorrida.status !== "running") return;

    const delta = Math.min((tempoAtual - estadoCorrida.ultimaFrame) / 1000, 0.05);
    estadoCorrida.ultimaFrame = tempoAtual;
    estadoCorrida.segundos += delta;

    const usandoSprint = estadoCorrida.sprintAtivo && estadoCorrida.folego > 0;
    const ritmoMetrosPorSegundo = usandoSprint ? 11.2 : 6.8;
    estadoCorrida.velocidadeAtual = ritmoMetrosPorSegundo * 3.6;
    estadoCorrida.picoVelocidade = Math.max(estadoCorrida.picoVelocidade, estadoCorrida.velocidadeAtual);
    estadoCorrida.distancia += delta * ritmoMetrosPorSegundo;

    if (usandoSprint) {
        estadoCorrida.folego = Math.max(0, estadoCorrida.folego - delta * 12);
        if (estadoCorrida.folego === 0) {
            estadoCorrida.folego = 5;
            estadoCorrida.sprintAtivo = false;
        }
    } else {
        estadoCorrida.folego = Math.min(100, estadoCorrida.folego + delta * 8);
    }

    if (estadoCorrida.folego <= 0) {
        estadoCorrida.sprintAtivo = false;
    }

    gerarElementosCorrida();

    estadoCorrida.obstaculos.forEach(function(obstaculo) {
        if (!obstaculo.resolvido && estadoCorrida.distancia >= obstaculo.distancia) {
            obstaculo.resolvido = true;

            if (obstaculo.faixa === estadoCorrida.faixa && tempoAtual > estadoCorrida.puloAte) {
                estadoCorrida.folego = Math.max(0, estadoCorrida.folego - 34);
                document.getElementById("mensagemCorrida").textContent =
                    "Cone atingido. Troque de faixa ou pule para proteger seu fôlego.";
            }
        }
    });

    estadoCorrida.bonus.forEach(function(item) {
        if (!item.coletado && estadoCorrida.distancia >= item.distancia) {
            item.coletado = true;

            if (item.faixa === estadoCorrida.faixa) {
                estadoCorrida.itensColetados++;
                estadoCorrida.folego = Math.min(100, estadoCorrida.folego + 12);
                document.getElementById("mensagemCorrida").textContent =
                    "Boa! Você encontrou um reforço e recuperou fôlego.";
            }
        }
    });

    if (estadoCorrida.distancia >= distanciaMetaCorrida) {
        concluirCorrida(true);
        return;
    }

    if (estadoCorrida.folego <= 0) {
        concluirCorrida(false);
        return;
    }

    if (estadoCorrida.distancia >= estadoCorrida.proximoCheckpoint) {
        estadoCorrida.distancia = estadoCorrida.proximoCheckpoint;
        abrirCheckpointCorrida();
        return;
    }

    estadoCorrida.obstaculos = estadoCorrida.obstaculos.filter(function(item) {
        return !item.resolvido || estadoCorrida.distancia - item.distancia < 20;
    });
    estadoCorrida.bonus = estadoCorrida.bonus.filter(function(item) {
        return !item.coletado || estadoCorrida.distancia - item.distancia < 20;
    });

    atualizarPainelCorrida();
    desenharCorrida(tempoAtual);
    estadoCorrida.frame = requestAnimationFrame(atualizarCorrida);

}


function concluirCorrida(completou) {

    estadoCorrida.sprintAtivo = false;
    estadoCorrida.status = completou ? "finished" : "failed";
    estadoCorrida.distancia = completou ? distanciaMetaCorrida : estadoCorrida.distancia;
    document.getElementById("checkpointMatematico").hidden = true;

    if (completou && !estadoCorrida.recompensaRegistrada) {
        estadoCorrida.recompensaRegistrada = true;
        const pontos = 20 + estadoCorrida.itensColetados * 2;
        const mediaAnterior = estadoCorrida.recorde ? 1440 / estadoCorrida.recorde : 0;
        const velocidadeMedia = distanciaMetaCorrida / estadoCorrida.segundos * 3.6;
        const novoRecorde = salvarRecordeCorrida(estadoCorrida.segundos);
        estadoCorrida.recorde = novoRecorde ? estadoCorrida.segundos : carregarRecordeCorrida();
        atualizarVitrineTenis();

        const novosTenis = premiosTenisCorrida
            .filter(function(tenis) {
                return tenis.meta > mediaAnterior && tenis.meta <= velocidadeMedia;
            })
            .map(function(tenis) {
                return tenis.marca + " " + tenis.modelo;
            });

        registrarPontuacao(pontos);
        registrarPontosPet(pontos);

        document.getElementById("mensagemCorrida").textContent =
            "Volta completa em " + formatarTempoCorrida(estadoCorrida.segundos) +
            (novoRecorde ? " · novo recorde pessoal!" : "") +
            " Média de " + velocidadeMedia.toFixed(1).replace(".", ",") + " km/h. Você ganhou " + pontos + " pontos." +
            (novosTenis.length ? " Novo tênis digital disponível: " + novosTenis.join(", ") + "." : "");
    } else {
        document.getElementById("mensagemCorrida").textContent =
            "O fôlego acabou antes da chegada. Descanse e tente outra estratégia.";
    }

    atualizarPainelCorrida();
    desenharCorrida(performance.now());

}


function desenharCorrida(tempoAtual) {

    const largura = canvasCorrida.width;
    const altura = 400;
    const contexto = contextoCorrida;

    contexto.clearRect(0, 0, largura, canvasCorrida.height);
    contexto.save();
    contexto.scale(1, canvasCorrida.height / altura);

    const ceu = contexto.createLinearGradient(0, 0, 0, altura);
    ceu.addColorStop(0, "#f0dcff");
    ceu.addColorStop(0.55, "#ffe2ed");
    ceu.addColorStop(1, "#fff1c9");
    contexto.fillStyle = ceu;
    contexto.fillRect(0, 0, largura, altura);

    contexto.fillStyle = "#ffd52a";
    contexto.beginPath();
    contexto.arc(790, 78, 35, 0, Math.PI * 2);
    contexto.fill();

    contexto.fillStyle = "#8d45d9";
    for (let index = 0; index < 10; index++) {
        const x = index * 108 - 8;
        const prediosAltura = 40 + (index * 29 % 65);
        contexto.globalAlpha = 0.36;
        contexto.fillRect(x, 184 - prediosAltura, 72, prediosAltura);
    }
    contexto.globalAlpha = 1;

    contexto.fillStyle = "#67b85d";
    contexto.fillRect(0, 183, largura, altura - 183);

    contexto.fillStyle = "#5b4967";
    contexto.beginPath();
    contexto.moveTo(350, 180);
    contexto.lineTo(610, 180);
    contexto.lineTo(960, altura);
    contexto.lineTo(0, altura);
    contexto.closePath();
    contexto.fill();

    contexto.strokeStyle = "rgba(255,255,255,0.78)";
    contexto.lineWidth = 4;
    contexto.beginPath();
    contexto.moveTo(350, 180);
    contexto.lineTo(0, altura);
    contexto.moveTo(610, 180);
    contexto.lineTo(960, altura);
    contexto.stroke();

    for (let faixa = 1; faixa < 3; faixa++) {
        const topo = 480 + (faixa - 1) * (260 / 6);
        const base = 480 + (faixa - 1) * 160;
        contexto.strokeStyle = "rgba(255,255,255,0.55)";
        contexto.lineWidth = 3;
        contexto.setLineDash([12, 12]);
        contexto.beginPath();
        contexto.moveTo(topo, 180);
        contexto.lineTo(base, altura);
        contexto.stroke();
    }
    contexto.setLineDash([]);

    estadoCorrida.obstaculos.forEach(function(obstaculo) {
        const aproximacao = (estadoCorrida.distancia - (obstaculo.distancia - 72)) / 72;
        if (aproximacao < 0 || aproximacao > 1.08 || obstaculo.resolvido) return;

        const y = 184 + aproximacao * 198;
        const escala = 0.28 + aproximacao * 0.82;
        const x = 480 + (obstaculo.faixa - 1) * (82 + aproximacao * 195);
        const coneLargura = 18 * escala;
        const coneAltura = 30 * escala;

        contexto.fillStyle = "#f39a22";
        contexto.beginPath();
        contexto.moveTo(x, y - coneAltura);
        contexto.lineTo(x - coneLargura / 2, y);
        contexto.lineTo(x + coneLargura / 2, y);
        contexto.closePath();
        contexto.fill();
        contexto.fillStyle = "#fffaf7";
        contexto.fillRect(x - coneLargura * 0.27, y - coneAltura * 0.38, coneLargura * 0.54, 4 * escala);
    });

    estadoCorrida.bonus.forEach(function(item) {
        const aproximacao = (estadoCorrida.distancia - (item.distancia - 72)) / 72;
        if (aproximacao < 0 || aproximacao > 1 || item.coletado) return;

        const y = 180 + aproximacao * 184;
        const x = 480 + (item.faixa - 1) * (82 + aproximacao * 195);
        contexto.font = Math.round(19 + aproximacao * 18) + "px Arial";
        contexto.textAlign = "center";
        contexto.fillText("✦", x, y);
    });

    const balanco = estadoCorrida.status === "running" ? Math.sin((tempoAtual || 0) / 85) * 5 : 0;
    const saltando = (tempoAtual || 0) < estadoCorrida.puloAte;
    const corredorX = 480 + (estadoCorrida.faixa - 1) * 220;
    const corredorY = 333 - (saltando ? 42 : 0) + balanco;

    contexto.lineCap = "round";
    contexto.lineWidth = 9;
    contexto.strokeStyle = "#4b176f";
    contexto.beginPath();
    contexto.moveTo(corredorX - 2, corredorY + 25);
    contexto.lineTo(corredorX - 13 + balanco, corredorY + 42);
    contexto.lineTo(corredorX - 22 + balanco, corredorY + 42);
    contexto.moveTo(corredorX + 2, corredorY + 25);
    contexto.lineTo(corredorX + 14 - balanco, corredorY + 40);
    contexto.lineTo(corredorX + 22 - balanco, corredorY + 40);
    contexto.stroke();

    contexto.strokeStyle = "#ff5c9a";
    contexto.lineWidth = 13;
    contexto.beginPath();
    contexto.moveTo(corredorX, corredorY + 1);
    contexto.lineTo(corredorX + balanco, corredorY + 26);
    contexto.stroke();

    contexto.strokeStyle = "#4b176f";
    contexto.lineWidth = 7;
    contexto.beginPath();
    contexto.moveTo(corredorX - 1, corredorY + 7);
    contexto.lineTo(corredorX - 13 - balanco, corredorY + 20);
    contexto.moveTo(corredorX + 1, corredorY + 7);
    contexto.lineTo(corredorX + 13 + balanco, corredorY + 18);
    contexto.stroke();

    contexto.fillStyle = "#f2bd9a";
    contexto.beginPath();
    contexto.arc(corredorX, corredorY - 8, 10, 0, Math.PI * 2);
    contexto.fill();

    contexto.fillStyle = "#ffd52a";
    contexto.fillRect(corredorX - 25 + balanco, corredorY + 38, 15, 5);
    contexto.fillRect(corredorX + 11 - balanco, corredorY + 38, 15, 5);

    if (estadoCorrida.status === "finished" || estadoCorrida.status === "failed" || estadoCorrida.status === "paused") {
        contexto.fillStyle = "rgba(53,29,79,0.62)";
        contexto.fillRect(0, 0, largura, altura);
        contexto.fillStyle = "#ffffff";
        contexto.textAlign = "center";
        contexto.font = "bold 34px Arial";
        contexto.fillText(
            estadoCorrida.status === "finished" ? "VOLTA COMPLETA" :
                estadoCorrida.status === "failed" ? "HORA DE RECUPERAR" : "PROVA PAUSADA",
            largura / 2,
            altura / 2
        );
        contexto.font = "18px Arial";
        contexto.fillText(
            estadoCorrida.status === "finished" ? "400 m · " + formatarTempoCorrida(estadoCorrida.segundos) :
                estadoCorrida.status === "failed" ? "Seu próximo treino começa com outra tentativa." : "Respire. Sua corrida continua quando quiser.",
            largura / 2,
            altura / 2 + 34
        );
    }

    contexto.restore();

}


/* =========================================
   VIDEOS
========================================= */

function assistirVideo(busca) {

    const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(busca);

    window.open(
        url,
        "_blank"
    );

}


/* =========================================
   FECHAR MODAL CLICANDO FORA
========================================= */

document.getElementById("modalJogo").addEventListener(
    "click",
    function(event) {

        if (event.target === this) {

            fecharJogo();

        }

    }
);


/* =========================================
   ESC PARA FECHAR
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        const jogoCorridaAtivo = document.getElementById("corrida").classList.contains("ativo");

        if (jogoCorridaAtivo && estadoCorrida.status === "running") {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                moverCorredor(-1);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                moverCorredor(1);
            } else if (event.key === "Shift") {
                event.preventDefault();
                definirSprint(true);
            } else if (event.code === "Space" || event.key === "ArrowUp") {
                event.preventDefault();
                pularObstaculo();
            } else if (event.key.toLowerCase() === "p") {
                alternarPausaCorrida();
            }
        }

        if (event.key === "Escape") {

            fecharJogo();

        }

    }
);


document.addEventListener("keyup", function(event) {
    if (event.key === "Shift") {
        definirSprint(false);
    }
});


window.addEventListener("blur", function() {
    definirSprint(false);
});


/* =========================================
   VERIFICAR LOGIN SALVO
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const emailSalvo =
            localStorage.getItem("mathzoneEmail");


        if (emailSalvo) {

            document.getElementById("telaLogin").style.display =
                "none";

            document
                .getElementById("sitePrincipal")
                .classList.add("visivel");

        } else {

            document.getElementById("telaLogin").style.display =
                "flex";

        }

    }
);