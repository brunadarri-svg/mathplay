/* =========================================
   LOGIN
========================================= */

const chaveContasLocaisMathZone = "mathzoneContasLocaisV1";
const iteracoesHashSenhaMathZone = 120000;

async function derivarHashSenhaMathZone(senha, sal) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Este navegador não oferece armazenamento seguro de credenciais.");
    }

    const bytesSal = Uint8Array.from(atob(sal), function(caractere) {
        return caractere.charCodeAt(0);
    });
    const material = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(senha),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const resultado = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: bytesSal,
            iterations: iteracoesHashSenhaMathZone,
            hash: "SHA-256"
        },
        material,
        256
    );
    let binario = "";
    new Uint8Array(resultado).forEach(function(byte) {
        binario += String.fromCharCode(byte);
    });

    return btoa(binario);
}

function obterContasLocaisMathZone() {
    const contasSalvas = localStorage.getItem(chaveContasLocaisMathZone);
    const contas = contasSalvas ? JSON.parse(contasSalvas) : [];

    if (!Array.isArray(contas)) {
        throw new Error("Os dados de conta salvos não possuem o formato esperado.");
    }

    return contas.filter(function(conta) {
        return conta &&
            typeof conta.email === "string" &&
            typeof conta.nome === "string" &&
            typeof conta.sal === "string" &&
            typeof conta.hashSenha === "string";
    });
}

function mostrarMensagemConta(texto, tipo) {
    const mensagem = document.getElementById("mensagemLogin");
    mensagem.textContent = texto;
    mensagem.className = "mensagem-login " + tipo;
}

function limparMensagemConta() {
    const mensagem = document.getElementById("mensagemLogin");
    mensagem.textContent = "";
    mensagem.className = "mensagem-login";
}

function mostrarFormulariosConta(cadastro) {
    document.getElementById("formLogin").hidden = cadastro;
    document.getElementById("formCadastro").hidden = !cadastro;
    document.getElementById("linhaOuLogin").hidden = cadastro;
    document.getElementById("alternarContaLogin").hidden = cadastro;
    document.getElementById("alternarContaCadastro").hidden = !cadastro;
    document.querySelector(".login-card h2").textContent =
        cadastro ? "Crie sua conta MathZone" : "Entre na sua pista";
    document.querySelector(".subtitulo-login").textContent = cadastro
        ? "Monte seu perfil e acompanhe sua evolução na pista."
        : "Acesse seus treinos, recordes e conquistas.";
    limparMensagemConta();
}

function mostrarCadastro() {
    mostrarFormulariosConta(true);
    document.getElementById("nomeCadastro").focus();
}

function mostrarLogin() {
    mostrarFormulariosConta(false);
    document.getElementById("emailLogin").focus();
}

async function cadastrarConta(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeCadastro").value.trim();
    const email = document.getElementById("emailCadastro").value.trim().toLowerCase();
    const senha = document.getElementById("senhaCadastro").value;
    const confirmarSenha = document.getElementById("confirmarSenhaCadastro").value;

    if (nome.length < 2 || !email.includes("@") || senha.length < 8) {
        mostrarMensagemConta("Confira seu nome, e-mail e senha com pelo menos 8 caracteres.", "erro");
        return;
    }

    if (senha !== confirmarSenha) {
        mostrarMensagemConta("As senhas não coincidem. Confira e tente novamente.", "erro");
        document.getElementById("confirmarSenhaCadastro").focus();
        return;
    }

    try {
        const contas = obterContasLocaisMathZone();
        if (contas.some(function(conta) { return conta.email === email; })) {
            mostrarMensagemConta("Já existe uma conta com esse e-mail neste navegador. Entre ou use outro e-mail.", "erro");
            return;
        }

        const bytesSal = window.crypto.getRandomValues(new Uint8Array(16));
        let binarioSal = "";
        bytesSal.forEach(function(byte) {
            binarioSal += String.fromCharCode(byte);
        });
        const sal = btoa(binarioSal);
        const hashSenha = await derivarHashSenhaMathZone(senha, sal);

        contas.push({
            nome: nome,
            email: email,
            sal: sal,
            hashSenha: hashSenha
        });
        localStorage.setItem(chaveContasLocaisMathZone, JSON.stringify(contas));

        document.getElementById("emailLogin").value = email;
        document.getElementById("senhaLogin").value = "";
        document.getElementById("senhaCadastro").value = "";
        document.getElementById("confirmarSenhaCadastro").value = "";
        mostrarFormulariosConta(false);
        mostrarMensagemConta("Conta criada neste navegador. Agora entre com seu e-mail e senha.", "sucesso");
        document.getElementById("senhaLogin").focus();
    } catch (erro) {
        console.error("Não foi possível criar a conta local do MathZone.", erro);
        mostrarMensagemConta(
            erro.message || "Não foi possível criar a conta neste navegador. Tente novamente.",
            "erro"
        );
    }
}

async function entrarMathZone(event) {
    event.preventDefault();

    const email = document.getElementById("emailLogin").value.trim();
    const emailNormalizado = email.toLowerCase();
    const senha = document.getElementById("senhaLogin").value;

    if (email === "" || senha === "") {
        mostrarMensagemConta("Preencha o e-mail e a senha.", "erro");
        return;
    }

    if (!email.includes("@")) {
        mostrarMensagemConta("Digite um e-mail válido.", "erro");
        return;
    }

    try {
        const conta = obterContasLocaisMathZone().find(function(item) {
            return item.email === emailNormalizado;
        });

        if (!conta) {
            mostrarMensagemConta("Conta não encontrada neste navegador. Use “Criar conta” para começar.", "erro");
            return;
        }

        const hashInformado = await derivarHashSenhaMathZone(senha, conta.sal);
        if (hashInformado !== conta.hashSenha) {
            mostrarMensagemConta("E-mail ou senha incorretos. Confira os dados e tente novamente.", "erro");
            return;
        }

        localStorage.setItem("mathzoneEmail", conta.email);
        localStorage.setItem("mathzoneNome", conta.nome);
        document.getElementById("telaLogin").style.display = "none";
        document.getElementById("sitePrincipal").classList.add("visivel");
        sincronizarVideosReels("inicio");
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (erro) {
        console.error("Não foi possível entrar na conta MathZone.", erro);
        mostrarMensagemConta(
            erro.message || "Não foi possível acessar sua conta neste navegador.",
            "erro"
        );
    }
}


/* =========================================
   MOSTRAR SENHA
========================================= */

function mostrarSenha() {
    alternarVisibilidadeSenha("senhaLogin", document.querySelector("#formLogin .mostrar-senha"));
}

function alternarVisibilidadeSenha(idCampo, botao) {
    const campo = document.getElementById(idCampo);
    const exibir = campo.type === "password";
    campo.type = exibir ? "text" : "password";
    botao.textContent = exibir ? "Ocultar senha" : "Mostrar senha";
}


/* =========================================
   CRIAR CONTA
========================================= */

function criarConta() {
    mostrarCadastro();
}


/* =========================================
   SAIR
========================================= */

function sair() {

    sincronizarVideosReels(null);

    localStorage.removeItem("mathzoneEmail");
    localStorage.removeItem("mathzoneNome");

    document.getElementById("sitePrincipal").classList.remove("visivel");

    document.getElementById("telaLogin").style.display = "flex";

    document.getElementById("emailLogin").value = "";
    document.getElementById("senhaLogin").value = "";

}

/* =========================================
   ACESSIBILIDADE VISUAL PARA PESSOAS SURDAS
========================================= */

function alternarPainelAcessibilidade(abrir) {
    const painel = document.getElementById("painelAcessibilidade");
    const botao = document.getElementById("botaoAcessibilidade");
    const aberto = typeof abrir === "boolean" ? abrir : painel.hidden;

    painel.hidden = !aberto;
    botao.setAttribute("aria-expanded", String(aberto));
    if (aberto) {
        painel.querySelector(".fechar-acessibilidade").focus();
    } else {
        botao.focus();
    }
}

function definirModoVisualSurdo(ativado) {
    const aviso = document.getElementById("avisoModoVisual");
    document.body.classList.toggle("apoio-visual-surdo", ativado);
    document.getElementById("modoVisualSurdo").checked = ativado;
    aviso.hidden = !ativado;
    aviso.textContent = ativado
        ? "Modo visual ativado. Instruções e avisos importantes são apresentados por escrito."
        : "Modo visual desativado.";

    try {
        localStorage.setItem("mathzoneModoVisualSurdo", ativado ? "ativado" : "desativado");
    } catch (erro) {
        console.error("Não foi possível salvar a preferência de acessibilidade.", erro);
        aviso.hidden = false;
        aviso.textContent += " A preferência não pôde ser salva neste navegador.";
    }
}

function iniciarAcessibilidade() {
    let ativado = false;
    try {
        ativado = localStorage.getItem("mathzoneModoVisualSurdo") === "ativado";
    } catch (erro) {
        console.error("Não foi possível carregar a preferência de acessibilidade.", erro);
        const aviso = document.getElementById("avisoModoVisual");
        aviso.hidden = false;
        aviso.textContent = "Não foi possível carregar sua preferência de acessibilidade.";
    }

    document.body.classList.toggle("apoio-visual-surdo", ativado);
    document.getElementById("modoVisualSurdo").checked = ativado;
    document.getElementById("avisoModoVisual").hidden = !ativado;
    if (ativado) {
        document.getElementById("avisoModoVisual").textContent =
            "Modo visual ativado. Instruções e avisos importantes são apresentados por escrito.";
    }

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && !document.getElementById("painelAcessibilidade").hidden) {
            alternarPainelAcessibilidade(false);
        }
    });
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

        document.querySelectorAll("[data-tela]").forEach(function(botao) {
            if (botao.dataset.tela === tela) {
                botao.setAttribute("aria-current", "page");
            } else {
                botao.removeAttribute("aria-current");
            }
        });

        if (tela === "ranking") {
            atualizarRanking();
        }

        if (tela === "recompensas") {
            atualizarRecompensas();
        }

        if (tela === "clubePro") {
            iniciarClubePro();
        }

        sincronizarVideosReels(tela);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

}

let observadorReels = null;

function atualizarControleVideoReel(slide, reproduzindo) {
    const botao = slide.querySelector("[data-reel-play]");

    botao.setAttribute("aria-label", reproduzindo ? "Pausar vídeo" : "Reproduzir vídeo");
    botao.querySelector("span").textContent = reproduzindo ? "Ⅱ" : "▶";
    botao.querySelector("small").textContent = reproduzindo ? "Pausar" : "Assistir";
}

function reproduzirVideoReel(slide) {
    const video = slide.querySelector("video");
    const resultado = video.play();

    if (resultado && typeof resultado.then === "function") {
        resultado.then(function() {
            atualizarControleVideoReel(slide, !video.paused);
        }).catch(function(erro) {
            if (erro.name === "AbortError") {
                return;
            }

            video.controls = true;
            atualizarControleVideoReel(slide, false);
        });
    } else {
        atualizarControleVideoReel(slide, !video.paused);
    }
}

function pausarVideoReel(slide) {
    slide.querySelector("video").pause();
    atualizarControleVideoReel(slide, false);
}

function sincronizarVideosReels(tela) {
    const feed = document.getElementById("reelsFeed");
    const slides = Array.from(document.querySelectorAll(".reel-slide"));
    const videoFundo = document.querySelector(".hero-video-fundo");
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    slides.forEach(function(slide) {
        const video = slide.querySelector("video");

        if (video.dataset.controlesConfigurados) {
            return;
        }

        video.addEventListener("play", function() {
            atualizarControleVideoReel(slide, true);
        });
        video.addEventListener("pause", function() {
            atualizarControleVideoReel(slide, false);
        });
        video.dataset.controlesConfigurados = "true";
    });

    if (observadorReels) {
        observadorReels.disconnect();
        observadorReels = null;
    }

    if (videoFundo) {
        if (tela === "inicio" && !movimentoReduzido) {
            const resultado = videoFundo.play();

            if (resultado && typeof resultado.catch === "function") {
                resultado.catch(function(erro) {
                    if (erro.name !== "AbortError") {
                        console.error("O vídeo de fundo do MathZone não pôde ser reproduzido.", erro);
                    }
                });
            }
        } else {
            videoFundo.pause();
        }
    }

    if (tela !== "reels" || !feed || movimentoReduzido) {
        slides.forEach(function(slide) {
            pausarVideoReel(slide);
        });
        return;
    }

    if (!("IntersectionObserver" in window)) {
        slides.forEach(function(slide, indice) {
            if (indice === 0) {
                reproduzirVideoReel(slide);
            } else {
                pausarVideoReel(slide);
            }
        });
        return;
    }

    observadorReels = new IntersectionObserver(function(entradas) {
        entradas.forEach(function(entrada) {
            if (entrada.isIntersecting && entrada.intersectionRatio >= 0.65) {
                reproduzirVideoReel(entrada.target);
            } else {
                pausarVideoReel(entrada.target);
            }
        });
    }, {
        root: feed,
        threshold: [0, 0.65, 1]
    });

    slides.forEach(function(slide) {
        observadorReels.observe(slide);
    });

    reproduzirVideoReel(slides[0]);
}

function alternarRespostaReel(botao) {
    const resposta = document.getElementById(botao.getAttribute("aria-controls"));
    const mostrar = resposta.hidden;

    resposta.hidden = !mostrar;
    botao.setAttribute("aria-expanded", String(mostrar));
    botao.textContent = mostrar ? "Ocultar solução" : "Ver solução";
}

function curtirReel(botao) {
    const curtido = botao.getAttribute("aria-pressed") === "true";
    const totalBase = Number(botao.dataset.curtidas);
    const total = totalBase + (curtido ? -1 : 1);

    botao.setAttribute("aria-pressed", String(!curtido));
    botao.querySelector("span").textContent = curtido ? "♡" : "♥";
    botao.querySelector("small").textContent = String(total);
}

function alternarVideoReel(botao) {
    const slide = botao.closest(".reel-slide");
    const video = slide.querySelector("video");

    if (video.paused) {
        reproduzirVideoReel(slide);
    } else {
        pausarVideoReel(slide);
    }
}

function moverReel(botao, direcao) {
    const atual = botao.closest(".reel-slide");
    const destino = direcao > 0 ? atual.nextElementSibling : atual.previousElementSibling;

    if (destino) {
        const feed = atual.closest(".reels-feed");
        const distancia = destino.getBoundingClientRect().top - feed.getBoundingClientRect().top;

        feed.scrollBy({
            top: distancia,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
    }
}

/* =========================================
   PIT STOP MATEMÁTICO
========================================= */

const desafiosDiariosPista = [
    {
        pergunta: "Uma atleta completa 4 voltas de 400 m. Qual distância ela percorreu?",
        resposta: 1600,
        unidade: "metros",
        explicacao: "4 × 400 m = 1.600 m, ou 1,6 km."
    },
    {
        pergunta: "Uma corrida de 5 km foi concluída em 25 minutos. Qual foi o ritmo médio em minutos por quilômetro?",
        resposta: 5,
        unidade: "min/km",
        explicacao: "25 minutos ÷ 5 km = 5 min/km."
    },
    {
        pergunta: "Um corredor percorre 2,4 km em 12 minutos. Quantos metros ele corre, em média, por minuto?",
        resposta: 200,
        unidade: "m/min",
        explicacao: "2,4 km = 2.400 m. Então, 2.400 ÷ 12 = 200 m/min."
    },
    {
        pergunta: "Uma prova tem 2 km. Se você já correu 800 m, qual porcentagem da prova completou?",
        resposta: 40,
        unidade: "%",
        explicacao: "800 ÷ 2.000 = 0,4. Multiplicando por 100, são 40%."
    },
    {
        pergunta: "Você corre 3 voltas de 400 m e depois mais 200 m. Quantos quilômetros percorreu?",
        resposta: 1.4,
        unidade: "km",
        explicacao: "3 × 400 m + 200 m = 1.400 m, ou 1,4 km."
    },
    {
        pergunta: "Um treino de 6 km foi dividido em 3 partes iguais. Quantos metros tem cada parte?",
        resposta: 2000,
        unidade: "metros",
        explicacao: "6 km ÷ 3 = 2 km. Cada parte tem 2.000 m."
    },
    {
        pergunta: "Uma corredora faz 4 km em 20 minutos. Quantos quilômetros fará em 30 minutos no mesmo ritmo?",
        resposta: 6,
        unidade: "km",
        explicacao: "30 minutos é 1,5 vez 20 minutos. Então, 4 × 1,5 = 6 km."
    }
];
let desafioAtualPista = null;

function chaveDataLocal(data) {
    return data.getFullYear() + "-" +
        String(data.getMonth() + 1).padStart(2, "0") + "-" +
        String(data.getDate()).padStart(2, "0");
}

function chaveConclusaoDesafioPista(data) {
    const email = (localStorage.getItem("mathzoneEmail") || "visitante").trim().toLowerCase();
    return "mathzoneDesafioPista:" + email + ":" + chaveDataLocal(data);
}

function obterDesafioDiarioPista(data) {
    const hojeUtc = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate());
    const inicioAnoUtc = Date.UTC(data.getFullYear(), 0, 1);
    const diaAno = Math.floor((hojeUtc - inicioAnoUtc) / 86400000);
    return desafiosDiariosPista[diaAno % desafiosDiariosPista.length];
}

function formatarTempoPista(segundos) {
    const total = Math.round(segundos);
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const restoSegundos = total % 60;

    if (horas > 0) {
        return horas + ":" + String(minutos).padStart(2, "0") + ":" +
            String(restoSegundos).padStart(2, "0");
    }

    return minutos + ":" + String(restoSegundos).padStart(2, "0");
}

function calcularRitmoCorrida(event) {
    event.preventDefault();

    const distancia = Number(document.getElementById("distanciaRitmo").value);
    const minutos = Number(document.getElementById("minutosRitmo").value);
    const segundos = Number(document.getElementById("segundosRitmo").value);
    const tempoTotal = minutos * 60 + segundos;

    if (!Number.isFinite(distancia) || distancia <= 0 ||
        !Number.isFinite(tempoTotal) || tempoTotal <= 0) {
        document.getElementById("resultadoRitmo").setAttribute("data-erro", "true");
        document.getElementById("ritmoPorKm").textContent = "Confira os dados";
        return;
    }

    const ritmoSegundosKm = tempoTotal / distancia;
    const velocidadeKmH = distancia / (tempoTotal / 3600);
    const estimativa5k = ritmoSegundosKm * 5;
    const formatoDecimal = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    document.getElementById("resultadoRitmo").removeAttribute("data-erro");
    document.getElementById("ritmoPorKm").textContent =
        formatarTempoPista(ritmoSegundosKm) + " /km";
    document.getElementById("velocidadeMediaRitmo").textContent =
        formatoDecimal.format(velocidadeKmH) + " km/h";
    document.getElementById("tempoEstimado5k").textContent =
        formatarTempoPista(estimativa5k);
}

function iniciarPitStopMatematico() {
    const formularioRitmo = document.getElementById("formCalculadoraRitmo");
    const perguntaDiaria = document.getElementById("perguntaDesafioDiario");
    const formularioDiario = document.getElementById("formDesafioDiario");

    if (formularioRitmo) {
        calcularRitmoCorrida({ preventDefault: function() {} });
    }

    if (!perguntaDiaria || !formularioDiario) {
        return;
    }

    const agora = new Date();
    desafioAtualPista = obterDesafioDiarioPista(agora);
    perguntaDiaria.textContent = desafioAtualPista.pergunta;
    document.getElementById("unidadeDesafioDiario").textContent = desafioAtualPista.unidade;
    document.getElementById("dataDesafioDiario").textContent =
        agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

    let concluidoHoje = false;
    try {
        concluidoHoje = localStorage.getItem(chaveConclusaoDesafioPista(agora)) === "concluido";
    } catch (erro) {
        console.error("Não foi possível verificar o desafio diário salvo.", erro);
    }

    if (concluidoHoje) {
        document.getElementById("botaoResponderDesafioDiario").disabled = true;
        document.getElementById("respostaDesafioDiario").disabled = true;
        document.getElementById("feedbackDesafioDiario").textContent =
            "Desafio de hoje concluído! Volte amanhã para uma nova conta.";
        document.getElementById("feedbackDesafioDiario").classList.add("correto");
    }
}

function responderDesafioDiario(event) {
    event.preventDefault();

    if (!desafioAtualPista) {
        return;
    }

    const respostaElemento = document.getElementById("respostaDesafioDiario");
    const feedback = document.getElementById("feedbackDesafioDiario");
    const resposta = Number(respostaElemento.value);
    const estaCorreta = Number.isFinite(resposta) &&
        Math.abs(resposta - desafioAtualPista.resposta) < 0.0001;

    feedback.classList.remove("correto", "incorreto");

    if (!estaCorreta) {
        feedback.textContent = "Ainda não. Confira as unidades e tente mais uma vez.";
        feedback.classList.add("incorreto");
        return;
    }

    const chaveHoje = chaveConclusaoDesafioPista(new Date());

    try {
        localStorage.setItem(chaveHoje, "concluido");
    } catch (erro) {
        console.error("Não foi possível salvar a conclusão do desafio diário.", erro);
        feedback.textContent = "Não foi possível registrar sua resposta. Tente novamente.";
        feedback.classList.add("incorreto");
        return;
    }

    registrarPontuacao(10);
    registrarPontosTreino(10);
    document.getElementById("botaoResponderDesafioDiario").disabled = true;
    respostaElemento.disabled = true;
    feedback.textContent = "Na mosca! " + desafioAtualPista.explicacao + " +10 pontos para você.";
    feedback.classList.add("correto");
}

/* =========================================
   CLUBE PRO MATEMÁTICO
========================================= */

let analiseTreinoClubePro = null;

function chaveHistoricoClubePro() {
    const email = (localStorage.getItem("mathzoneEmail") || "visitante").trim().toLowerCase();
    return "mathzoneHistoricoClubePro:" + email;
}

function chaveDesafioClubePro(data) {
    const email = (localStorage.getItem("mathzoneEmail") || "visitante").trim().toLowerCase();
    return "mathzoneDesafioClubePro:" + email + ":" + chaveDataLocal(data);
}

function obterHistoricoClubePro() {
    try {
        const salvo = localStorage.getItem(chaveHistoricoClubePro());
        if (!salvo) {
            return [];
        }

        const historico = JSON.parse(salvo);
        if (!Array.isArray(historico)) {
            throw new Error("O histórico salvo não possui o formato esperado.");
        }

        return historico.filter(function(treino) {
            return treino &&
                Number.isFinite(treino.distancia) &&
                treino.distancia > 0 &&
                Number.isFinite(treino.tempoSegundos) &&
                treino.tempoSegundos > 0 &&
                typeof treino.criadoEm === "string" &&
                Number.isFinite(Date.parse(treino.criadoEm));
        });
    } catch (erro) {
        console.error("Não foi possível carregar o histórico do Clube Pro.", erro);
        document.getElementById("mensagemHistoricoClubePro").textContent =
            "Não foi possível carregar o histórico salvo neste navegador.";
        return [];
    }
}

function analisarTreinoClubePro(event) {
    event.preventDefault();

    const distancia = Number(document.getElementById("distanciaClubePro").value);
    const minutos = Number(document.getElementById("minutosClubePro").value);
    const segundos = Number(document.getElementById("segundosClubePro").value);
    const tempoSegundos = minutos * 60 + segundos;
    const feedback = document.getElementById("feedbackCalculadoraClubePro");
    const resultados = document.getElementById("resultadosClubePro");

    if (!Number.isFinite(distancia) || distancia < 0.1 || distancia > 100 ||
        !Number.isFinite(tempoSegundos) || tempoSegundos <= 0) {
        analiseTreinoClubePro = null;
        document.getElementById("salvarTreinoClubePro").disabled = true;
        resultados.setAttribute("data-erro", "true");
        feedback.textContent = "Informe uma distância entre 0,1 e 100 km e um tempo maior que zero.";
        return;
    }

    const ritmoSegundosKm = tempoSegundos / distancia;
    const velocidadeKmH = distancia / (tempoSegundos / 3600);
    analiseTreinoClubePro = {
        distancia: distancia,
        tempoSegundos: tempoSegundos,
        ritmoSegundosKm: ritmoSegundosKm,
        velocidadeKmH: velocidadeKmH,
        criadoEm: new Date().toISOString()
    };

    const formatoDecimal = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    resultados.removeAttribute("data-erro");
    document.getElementById("ritmoClubePro").textContent =
        formatarTempoPista(ritmoSegundosKm) + " /km";
    document.getElementById("velocidadeClubePro").textContent =
        formatoDecimal.format(velocidadeKmH) + " km/h";
    document.getElementById("parcialClubePro").textContent =
        formatarTempoPista(ritmoSegundosKm * 0.4);
    document.getElementById("projecaoClubePro").textContent =
        formatarTempoPista(ritmoSegundosKm * 10);
    document.getElementById("salvarTreinoClubePro").disabled = false;
    feedback.textContent = "Análise pronta. Salve para incluir no seu histórico.";
}

function salvarTreinoClubePro() {
    if (!analiseTreinoClubePro) {
        document.getElementById("feedbackCalculadoraClubePro").textContent =
            "Calcule uma análise antes de salvar o treino.";
        return;
    }

    try {
        const historico = obterHistoricoClubePro();
        historico.unshift(analiseTreinoClubePro);
        localStorage.setItem(chaveHistoricoClubePro(), JSON.stringify(historico.slice(0, 30)));
        analiseTreinoClubePro = null;
        document.getElementById("salvarTreinoClubePro").disabled = true;
        document.getElementById("feedbackCalculadoraClubePro").textContent =
            "Treino salvo. Seus números já aparecem no histórico.";
        atualizarHistoricoClubePro();
    } catch (erro) {
        console.error("Não foi possível salvar o treino do Clube Pro.", erro);
        document.getElementById("feedbackCalculadoraClubePro").textContent =
            "Não foi possível salvar o treino neste navegador.";
    }
}

function atualizarHistoricoClubePro() {
    const lista = document.getElementById("listaHistoricoClubePro");
    const vazio = document.getElementById("mensagemHistoricoClubePro");
    const botaoLimpar = document.getElementById("limparHistoricoClubePro");
    const historico = obterHistoricoClubePro();
    const totalDistancia = historico.reduce(function(total, treino) {
        return total + treino.distancia;
    }, 0);
    const totalTempo = historico.reduce(function(total, treino) {
        return total + treino.tempoSegundos;
    }, 0);

    document.getElementById("totalTreinosClubePro").textContent = String(historico.length);
    document.getElementById("distanciaTotalClubePro").textContent =
        new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(totalDistancia) + " km";
    document.getElementById("ritmoMedioClubePro").textContent = historico.length
        ? formatarTempoPista(totalTempo / totalDistancia) + " /km"
        : "—";

    lista.replaceChildren();
    vazio.hidden = historico.length > 0;
    botaoLimpar.hidden = historico.length === 0;

    historico.forEach(function(treino) {
        const item = document.createElement("li");
        const informacao = document.createElement("div");
        const data = document.createElement("time");
        const distancia = document.createElement("strong");
        const metrica = document.createElement("span");
        const instante = new Date(treino.criadoEm);

        item.className = "clube-pro-treino-item";
        data.dateTime = treino.criadoEm;
        data.textContent = instante.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        distancia.textContent =
            new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(treino.distancia) + " km";
        metrica.textContent =
            formatarTempoPista(treino.tempoSegundos) + " · " +
            formatarTempoPista(treino.tempoSegundos / treino.distancia) + " min/km";
        informacao.append(data, distancia, metrica);
        item.append(informacao);
        lista.append(item);
    });
}

function iniciarDesafioClubePro() {
    const resposta = document.getElementById("respostaDesafioClubePro");
    const botao = document.getElementById("botaoDesafioClubePro");
    const feedback = document.getElementById("feedbackDesafioClubePro");

    try {
        if (localStorage.getItem(chaveDesafioClubePro(new Date())) === "concluido") {
            resposta.disabled = true;
            botao.disabled = true;
            feedback.textContent = "Desafio de hoje concluído! Volte amanhã para ganhar mais pontos.";
            feedback.classList.add("correto");
        } else {
            resposta.disabled = false;
            botao.disabled = false;
            feedback.textContent = "";
            feedback.classList.remove("correto", "incorreto");
        }
    } catch (erro) {
        console.error("Não foi possível verificar o desafio diário do Clube Pro.", erro);
        feedback.textContent = "Não foi possível verificar seu desafio salvo neste navegador.";
        feedback.classList.add("incorreto");
    }
}

function responderDesafioClubePro(event) {
    event.preventDefault();

    const resposta = Number(document.getElementById("respostaDesafioClubePro").value);
    const feedback = document.getElementById("feedbackDesafioClubePro");
    const estaCorreta = Number.isFinite(resposta) && Math.abs(resposta - 5.4) < 0.005;

    feedback.classList.remove("correto", "incorreto");
    if (!estaCorreta) {
        feedback.textContent = "Ainda não. Calcule o tempo de cada trecho, some e divida por 5 km.";
        feedback.classList.add("incorreto");
        return;
    }

    try {
        localStorage.setItem(chaveDesafioClubePro(new Date()), "concluido");
    } catch (erro) {
        console.error("Não foi possível salvar a conclusão do desafio do Clube Pro.", erro);
        feedback.textContent = "Não foi possível registrar sua resposta. Tente novamente.";
        feedback.classList.add("incorreto");
        return;
    }

    registrarPontuacao(10);
    registrarPontosTreino(10);
    document.getElementById("respostaDesafioClubePro").disabled = true;
    document.getElementById("botaoDesafioClubePro").disabled = true;
    feedback.textContent = "Correto! O ritmo médio é 5,4 min/km: 5:24 por quilômetro. +10 pontos.";
    feedback.classList.add("correto");
}

function limparHistoricoClubePro() {
    if (!window.confirm("Deseja apagar o histórico de treinos deste dispositivo?")) {
        return;
    }

    try {
        localStorage.removeItem(chaveHistoricoClubePro());
        document.getElementById("feedbackCalculadoraClubePro").textContent =
            "Histórico apagado deste dispositivo.";
        atualizarHistoricoClubePro();
    } catch (erro) {
        console.error("Não foi possível apagar o histórico do Clube Pro.", erro);
        document.getElementById("mensagemHistoricoClubePro").textContent =
            "Não foi possível apagar o histórico salvo neste navegador.";
    }
}

function iniciarClubePro() {
    atualizarHistoricoClubePro();
    iniciarDesafioClubePro();
}


/* =========================================
   COMUNIDADE MATHZONE
========================================= */

const chaveComunidade = "mathzoneComunidade";
const publicacoesBaseComunidade = [
    {
        id: "desafio-voltas-400",
        categoria: "DESAFIO DA PISTA",
        imagem: "./assets/tenis/meninas-correndo-pista.jpg",
        alt: "Atletas correndo juntas em uma pista",
        curtidas: 1284,
        descricao: "Desafio do dia: 3 voltas de 400 m. Quantos metros você percorre? A pista também é lugar de fazer contas! 🏃‍♀️🧮"
    },
    {
        id: "ritmo-constante",
        categoria: "MENTALIDADE DE ATLETA",
        imagem: "./assets/tenis/adidas-adios-pro-4.jpg",
        alt: "Tênis Adidas Adios Pro 4 para corrida",
        curtidas: 968,
        descricao: "Cada treino tem seu ritmo. Se você corre 2,4 km em 12 minutos, qual é a sua média em metros por minuto? Deixe a resposta nos comentários. ⚡"
    },
    {
        id: "porcentagem-na-pista",
        categoria: "MATEMÁTICA EM MOVIMENTO",
        imagem: "./assets/tenis/olympikus-corre-4.jpg",
        alt: "Tênis Olympikus Corre 4 para corrida",
        curtidas: 742,
        descricao: "Uma prova tem 2 km e você já completou 800 m. Que porcentagem do percurso ficou para trás? Resolva, curta e compartilhe seu raciocínio. 📐"
    }
];

let estadoComunidade = {
    seguindo: false,
    curtidas: [],
    salvos: [],
    comentarios: {},
    publicacoes: []
};

let filtroAtualComunidade = "todas";
let ordemAtualComunidade = "recentes";

function carregarEstadoComunidade() {
    try {
        const salvo = JSON.parse(localStorage.getItem(chaveComunidade) || "null");

        if (!salvo || typeof salvo !== "object" || Array.isArray(salvo)) {
            return estadoComunidade;
        }

        estadoComunidade = {
            seguindo: salvo.seguindo === true,
            curtidas: Array.isArray(salvo.curtidas)
                ? salvo.curtidas.filter(function(id) { return typeof id === "string"; })
                : [],
            salvos: Array.isArray(salvo.salvos)
                ? salvo.salvos.filter(function(id) { return typeof id === "string"; })
                : [],
            comentarios: salvo.comentarios && typeof salvo.comentarios === "object" && !Array.isArray(salvo.comentarios)
                ? salvo.comentarios
                : {},
            publicacoes: Array.isArray(salvo.publicacoes)
                ? salvo.publicacoes.filter(function(postagem) {
                    return postagem &&
                        typeof postagem.id === "string" &&
                        typeof postagem.texto === "string" &&
                        typeof postagem.data === "string";
                })
                : []
        };
    } catch (erro) {
        console.error("Não foi possível carregar a comunidade MathZone.", erro);
        exibirMensagemComunidade("Não foi possível ler as interações salvas neste navegador.");
    }

    return estadoComunidade;
}

function salvarEstadoComunidade() {
    try {
        localStorage.setItem(chaveComunidade, JSON.stringify(estadoComunidade));
        return true;
    } catch (erro) {
        console.error("Não foi possível salvar as interações da comunidade MathZone.", erro);
        exibirMensagemComunidade("A ação funcionou nesta sessão, mas não foi possível salvá-la no navegador.");
        return false;
    }
}

function exibirMensagemComunidade(mensagem) {
    const elemento = document.getElementById("mensagemComunidade");

    if (elemento) {
        elemento.textContent = mensagem;
    }
}

function atualizarPerfilComunidade() {
    const botaoSeguir = document.getElementById("botaoSeguir");
    const seguidores = document.getElementById("totalSeguidores");
    const publicacoes = document.getElementById("totalPublicacoes");

    if (!botaoSeguir || !seguidores || !publicacoes) {
        return;
    }

    botaoSeguir.setAttribute("aria-pressed", String(estadoComunidade.seguindo));
    botaoSeguir.textContent = estadoComunidade.seguindo ? "Seguindo ✓" : "Seguir";
    seguidores.textContent = new Intl.NumberFormat("pt-BR", {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(12800 + (estadoComunidade.seguindo ? 1 : 0));
    publicacoes.textContent = String(publicacoesBaseComunidade.length + estadoComunidade.publicacoes.length);
}

function montarPostComunidade(postagem) {
    const cartao = document.createElement("article");
    cartao.className = "instagram-post";

    const topo = document.createElement("div");
    topo.className = "instagram-post-topo";

    const avatar = document.createElement("span");
    avatar.className = "instagram-post-avatar";
    const imagemAvatar = document.createElement("img");
    imagemAvatar.src = "./assets/mathzone-mark.svg";
    imagemAvatar.alt = "";
    avatar.appendChild(imagemAvatar);

    const identidade = document.createElement("div");
    identidade.className = "instagram-post-identidade";

    const nome = document.createElement("strong");
    nome.textContent = "MathZone Run Club";

    const categoria = document.createElement("span");
    categoria.textContent = postagem.categoria || postagem.data || "@mathzone.run";
    identidade.append(nome, categoria);
    topo.append(avatar, identidade);

    const seloVerificado = document.createElement("span");
    seloVerificado.className = "instagram-post-verificado";
    seloVerificado.textContent = "✓";
    seloVerificado.setAttribute("aria-label", "Perfil oficial da demonstração");
    topo.appendChild(seloVerificado);

    const dataPublicacao = document.createElement("time");
    dataPublicacao.className = "instagram-post-data";
    dataPublicacao.textContent = postagem.data || "Destaque da comunidade";
    topo.appendChild(dataPublicacao);

    const midia = document.createElement("div");
    midia.className = "instagram-post-midia";

    if (postagem.imagem) {
        const imagem = document.createElement("img");
        imagem.src = postagem.imagem;
        imagem.alt = postagem.alt;
        imagem.loading = "lazy";
        midia.appendChild(imagem);
    } else {
        midia.classList.add("instagram-post-midia-texto");
        const selo = document.createElement("span");
        selo.textContent = "🏁 MATHZONE · CORRIDA + MATEMÁTICA";
        const texto = document.createElement("strong");
        texto.textContent = "Uma ideia nova na pista";
        midia.append(selo, texto);
    }

    const acoes = document.createElement("div");
    acoes.className = "instagram-post-acoes";

    const botaoCurtir = document.createElement("button");
    botaoCurtir.className = "instagram-curtir";
    botaoCurtir.type = "button";
    const curtido = estadoComunidade.curtidas.includes(postagem.id);
    const contagemCurtidas = (postagem.curtidas || 0) + (curtido ? 1 : 0);
    botaoCurtir.setAttribute("aria-pressed", String(curtido));
    botaoCurtir.setAttribute("aria-label", curtido ? "Descurtir publicação" : "Curtir publicação");
    const iconeCurtir = document.createElement("span");
    iconeCurtir.setAttribute("aria-hidden", "true");
    iconeCurtir.textContent = curtido ? "♥" : "♡";
    botaoCurtir.append(iconeCurtir, document.createTextNode(curtido ? " Curtido" : " Curtir"));
    botaoCurtir.addEventListener("click", function() {
        if (curtido) {
            estadoComunidade.curtidas = estadoComunidade.curtidas.filter(function(id) {
                return id !== postagem.id;
            });
        } else {
            estadoComunidade.curtidas.push(postagem.id);
        }

        salvarEstadoComunidade();
        desenharComunidade();
    });

    acoes.appendChild(botaoCurtir);

    const botaoCompartilhar = document.createElement("button");
    botaoCompartilhar.className = "instagram-compartilhar";
    botaoCompartilhar.type = "button";
    botaoCompartilhar.setAttribute("aria-label", "Compartilhar publicação");
    botaoCompartilhar.innerHTML = '<span aria-hidden="true">↗</span>';
    botaoCompartilhar.addEventListener("click", function() {
        compartilharPostComunidade(postagem);
    });
    acoes.appendChild(botaoCompartilhar);

    const botaoSalvar = document.createElement("button");
    botaoSalvar.className = "instagram-salvar";
    botaoSalvar.type = "button";
    const estaSalvo = estadoComunidade.salvos.includes(postagem.id);
    botaoSalvar.setAttribute("aria-pressed", String(estaSalvo));
    botaoSalvar.setAttribute("aria-label", estaSalvo ? "Remover publicação das salvas" : "Salvar publicação");
    botaoSalvar.innerHTML = '<span aria-hidden="true">' + (estaSalvo ? "▣" : "▱") + '</span>';
    botaoSalvar.addEventListener("click", function() {
        if (estadoComunidade.salvos.includes(postagem.id)) {
            estadoComunidade.salvos = estadoComunidade.salvos.filter(function(id) {
                return id !== postagem.id;
            });
        } else {
            estadoComunidade.salvos.push(postagem.id);
        }

        salvarEstadoComunidade();
        desenharComunidade();
    });
    acoes.appendChild(botaoSalvar);

    const totalCurtidas = document.createElement("span");
    totalCurtidas.className = "instagram-total-curtidas";
    totalCurtidas.textContent = new Intl.NumberFormat("pt-BR").format(contagemCurtidas) +
        (contagemCurtidas === 1 ? " curtida" : " curtidas");

    const legenda = document.createElement("p");
    legenda.className = "instagram-legenda";
    const autor = document.createElement("strong");
    autor.textContent = "@mathzone.run ";
    legenda.append(autor, document.createTextNode(postagem.descricao || postagem.texto));

    const listaComentarios = document.createElement("div");
    listaComentarios.className = "instagram-comentarios";
    listaComentarios.hidden = comentariosVazios(postagem.id);
    const comentarios = Array.isArray(estadoComunidade.comentarios[postagem.id])
        ? estadoComunidade.comentarios[postagem.id]
        : [];

    comentarios.forEach(function(comentario) {
        const item = document.createElement("p");
        const nomeComentario = document.createElement("strong");
        nomeComentario.textContent = "Você ";
        item.append(nomeComentario, document.createTextNode(comentario));
        listaComentarios.appendChild(item);
    });

    const botaoComentarios = document.createElement("button");
    botaoComentarios.className = "instagram-ver-comentarios";
    botaoComentarios.type = "button";
    botaoComentarios.textContent = comentarios.length
        ? "Ver todos os " + comentarios.length + " comentários"
        : "Inicie a conversa";
    botaoComentarios.setAttribute("aria-expanded", String(!listaComentarios.hidden));
    botaoComentarios.addEventListener("click", function() {
        listaComentarios.hidden = !listaComentarios.hidden;
        botaoComentarios.setAttribute("aria-expanded", String(!listaComentarios.hidden));
    });

    const formularioComentario = document.createElement("form");
    formularioComentario.className = "instagram-comentar";
    const campoComentario = document.createElement("input");
    campoComentario.type = "text";
    campoComentario.maxLength = 160;
    campoComentario.placeholder = "Adicione um comentário...";
    campoComentario.setAttribute("aria-label", "Escreva um comentário");
    campoComentario.required = true;
    const botaoComentar = document.createElement("button");
    botaoComentar.type = "submit";
    botaoComentar.textContent = "Enviar";

    formularioComentario.addEventListener("submit", function(event) {
        event.preventDefault();
        const comentario = campoComentario.value.trim();

        if (!comentario) {
            campoComentario.focus();
            return;
        }

        if (!Array.isArray(estadoComunidade.comentarios[postagem.id])) {
            estadoComunidade.comentarios[postagem.id] = [];
        }

        estadoComunidade.comentarios[postagem.id].push(comentario);
        salvarEstadoComunidade();
        desenharComunidade();
    });

    formularioComentario.append(campoComentario, botaoComentar);
    cartao.append(topo, midia, acoes, totalCurtidas, legenda, botaoComentarios, listaComentarios, formularioComentario);
    return cartao;
}

function comentariosVazios(id) {
    return !Array.isArray(estadoComunidade.comentarios[id]) ||
        estadoComunidade.comentarios[id].length === 0;
}

function desenharComunidade() {
    atualizarPerfilComunidade();

    const feed = document.getElementById("feedComunidade");

    if (!feed) {
        return;
    }

    feed.replaceChildren();
    let publicacoes = estadoComunidade.publicacoes.concat(publicacoesBaseComunidade);

    if (filtroAtualComunidade === "desafios") {
        publicacoes = publicacoes.filter(function(postagem) {
            return /desafio|matemática|pista|porcentagem|ritmo/i.test(
                (postagem.categoria || "") + " " + (postagem.descricao || "") + " " + (postagem.texto || "")
            );
        });
    } else if (filtroAtualComunidade === "salvas") {
        publicacoes = publicacoes.filter(function(postagem) {
            return estadoComunidade.salvos.includes(postagem.id);
        });
    }

    if (ordemAtualComunidade === "populares") {
        publicacoes.sort(function(a, b) {
            return (b.curtidas || 0) - (a.curtidas || 0);
        });
    } else {
        publicacoes.sort(function(a, b) {
            const dataA = a.criadoEm || 0;
            const dataB = b.criadoEm || 0;
            return dataB - dataA;
        });
    }

    if (publicacoes.length === 0) {
        const vazio = document.createElement("div");
        vazio.className = "instagram-feed-vazio";
        vazio.textContent = filtroAtualComunidade === "salvas"
            ? "Você ainda não salvou publicações. Toque no marcador de um post para guardá-lo aqui."
            : "Nenhuma publicação nesta categoria por enquanto.";
        feed.appendChild(vazio);
    } else {
        publicacoes.forEach(function(postagem) {
            feed.appendChild(montarPostComunidade(postagem));
        });
    }

    document.querySelectorAll("[data-filtro-comunidade]").forEach(function(botao) {
        botao.setAttribute("aria-selected", String(botao.dataset.filtroComunidade === filtroAtualComunidade));
    });
}

function iniciarComunidade() {
    carregarEstadoComunidade();
    desenharComunidade();

    const formulario = document.getElementById("formPublicacaoComunidade");

    if (formulario) {
        formulario.addEventListener("input", function() {
            exibirMensagemComunidade("");
        });
    }

    const campoPublicacao = document.getElementById("textoPublicacao");

    if (campoPublicacao) {
        campoPublicacao.addEventListener("input", atualizarContadorPublicacao);
    }
}

function atualizarContadorPublicacao() {
    const campo = document.getElementById("textoPublicacao");
    const contador = document.getElementById("contadorPublicacao");

    if (campo && contador) {
        contador.textContent = campo.value.length + " / 280";
    }
}

function filtrarFeedComunidade(filtro) {
    filtroAtualComunidade = filtro;
    desenharComunidade();
}

function ordenarFeedComunidade(ordem) {
    ordemAtualComunidade = ordem === "populares" ? "populares" : "recentes";
    desenharComunidade();
}

async function compartilharPostComunidade(postagem) {
    const texto = (postagem.descricao || postagem.texto || "").trim() + " — @mathzone.run";

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        exibirMensagemComunidade("Seu navegador não permite copiar automaticamente. Copie o texto do post para compartilhar: " + texto);
        return;
    }

    try {
        await navigator.clipboard.writeText(texto);
        exibirMensagemComunidade("Texto da publicação copiado. Agora você pode compartilhá-lo!");
    } catch (erro) {
        console.error("Não foi possível copiar a publicação da comunidade.", erro);
        exibirMensagemComunidade("Não foi possível copiar automaticamente. Você pode copiar o texto da publicação para compartilhar.");
    }
}

function alternarSeguirComunidade() {
    estadoComunidade.seguindo = !estadoComunidade.seguindo;
    salvarEstadoComunidade();
    atualizarPerfilComunidade();

    if (!document.getElementById("mensagemComunidade").textContent) {
        exibirMensagemComunidade(estadoComunidade.seguindo
            ? "Você está seguindo o MathZone Run Club nesta comunidade."
            : "Você deixou de seguir o MathZone Run Club.");
    }
}

function publicarNaComunidade(event) {
    event.preventDefault();

    const campo = document.getElementById("textoPublicacao");
    const texto = campo.value.trim();

    if (!texto) {
        exibirMensagemComunidade("Escreva uma ideia ou um desafio antes de publicar.");
        campo.focus();
        return;
    }

    estadoComunidade.publicacoes.unshift({
        id: "post-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        texto: texto,
        categoria: document.getElementById("categoriaPublicacao").value,
        data: new Date().toLocaleDateString("pt-BR"),
        criadoEm: Date.now(),
        curtidas: 0
    });
    salvarEstadoComunidade();
    campo.value = "";
    document.getElementById("categoriaPublicacao").value = "TREINO";
    atualizarContadorPublicacao();
    desenharComunidade();

    if (!document.getElementById("mensagemComunidade").textContent) {
        exibirMensagemComunidade("Sua publicação já está na pista!");
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
   RECOMPENSAS DA PISTA
========================================= */

const chaveContasRecompensas = "mathzoneContasPets";
const recompensasLegadas = {
    coelho: "banana-energia",
    gato: "garrafa-hidratacao",
    raposa: "medalha-prata",
    dragao: "medalha-ouro"
};
const catalogoRecompensas = [
    { id: "banana-energia", nome: "Banana do Sprint", categoria: "ENERGIA DE PISTA", emoji: "🍌", custo: 30, descricao: "Uma pausa saborosa para recarregar antes da próxima volta." },
    { id: "garrafa-hidratacao", nome: "Garrafa de Hidratação", categoria: "HIDRATAÇÃO", emoji: "🥤", custo: 50, descricao: "Lembrete para se hidratar entre um desafio e outro." },
    { id: "medalha-bronze", nome: "Medalha de Bronze", categoria: "PRIMEIRA CONQUISTA", emoji: "🥉", custo: 60, descricao: "O primeiro passo de uma coleção feita de esforço." },
    { id: "medalha-prata", nome: "Medalha de Prata", categoria: "RITMO CONSTANTE", emoji: "🥈", custo: 80, descricao: "Para quem mantém o ritmo e segue evoluindo." },
    { id: "medalha-ouro", nome: "Medalha de Ouro", categoria: "DESTAQUE DA PISTA", emoji: "🥇", custo: 120, descricao: "Reconhecimento por uma sequência de grandes treinos." },
    { id: "trofeu-chegada", nome: "Troféu da Chegada", categoria: "GRANDE CONQUISTA", emoji: "🏆", custo: 220, descricao: "O prêmio especial para quem cruza a linha de chegada." }
];


function carregarContaRecompensas() {

    const email = (localStorage.getItem("mathzoneEmail") || "").trim().toLowerCase();

    if (!email) {
        return null;
    }

    let contas = {};

    try {
        const contasSalvas = JSON.parse(localStorage.getItem(chaveContasRecompensas) || "{}");

        if (contasSalvas && typeof contasSalvas === "object" && !Array.isArray(contasSalvas)) {
            contas = contasSalvas;
        }
    } catch (erro) {
        contas = {};
    }

    if (!contas[email] || typeof contas[email] !== "object") {
        contas[email] = { pontos: 0, colecao: [], recompensaAtiva: null };
    }

    const perfil = contas[email];

    if (!Number.isFinite(perfil.pontos)) {
        perfil.pontos = 0;
    }

    if (!Array.isArray(perfil.colecao)) {
        perfil.colecao = [];
    }

    perfil.colecao = Array.from(new Set(perfil.colecao.map(function(id) {
        return recompensasLegadas[id] || id;
    }))).filter(function(id) {
        return catalogoRecompensas.some(function(recompensa) {
            return recompensa.id === id;
        });
    });

    if (!("recompensaAtiva" in perfil)) {
        perfil.recompensaAtiva = recompensasLegadas[perfil.petAtivo] || null;
    }

    delete perfil.petAtivo;

    if (!perfil.colecao.includes(perfil.recompensaAtiva)) {
        perfil.recompensaAtiva = null;
    }

    return { email: email, contas: contas, perfil: perfil };

}


function salvarContasRecompensas(contas) {
    localStorage.setItem(chaveContasRecompensas, JSON.stringify(contas));
}


function registrarPontosTreino(pontos) {

    const dados = carregarContaRecompensas();

    if (!dados) {
        return;
    }

    dados.perfil.pontos += pontos;
    salvarContasRecompensas(dados.contas);
    atualizarRecompensas();

}


function criarElementoRecompensa(recompensa, classe) {

    const ilustracao = document.createElement("div");
    ilustracao.className = classe;
    ilustracao.textContent = recompensa.emoji;
    ilustracao.setAttribute("aria-hidden", "true");

    return ilustracao;

}


function atualizarRecompensas() {

    const dados = carregarContaRecompensas();
    const saldo = document.getElementById("saldoPista");
    const total = document.getElementById("totalRecompensas");
    const destaque = document.getElementById("recompensaDestaque");
    const loja = document.getElementById("lojaRecompensas");
    const colecao = document.getElementById("colecaoRecompensas");
    const recompensasAdquiridas = dados ? dados.perfil.colecao : [];
    const recompensaAtiva = dados
        ? catalogoRecompensas.find(function(recompensa) {
            return recompensa.id === dados.perfil.recompensaAtiva;
        })
        : null;

    loja.replaceChildren();
    colecao.replaceChildren();

    saldo.textContent = (dados ? dados.perfil.pontos : 0) + " pts";
    total.textContent = recompensasAdquiridas.length;
    destaque.replaceChildren();

    if (recompensaAtiva) {
        destaque.appendChild(criarElementoRecompensa(recompensaAtiva, "recompensa-destaque-icone"));

        const textoDestaque = document.createElement("div");
        textoDestaque.className = "recompensa-destaque-texto";

        const etiqueta = document.createElement("span");
        etiqueta.textContent = "CONQUISTA EM DESTAQUE";

        const nome = document.createElement("h3");
        nome.textContent = recompensaAtiva.nome;

        const descricao = document.createElement("p");
        descricao.textContent = recompensaAtiva.descricao;

        textoDestaque.append(etiqueta, nome, descricao);
        destaque.appendChild(textoDestaque);
        destaque.classList.remove("recompensa-destaque-vazio");
    } else {
        destaque.classList.add("recompensa-destaque-vazio");

        const vazio = document.createElement("p");
        vazio.textContent = "Sua primeira conquista espera na vitrine. Ganhe pontos nos desafios e escolha uma recompensa.";
        destaque.appendChild(criarElementoRecompensa({ emoji: "🏁" }, "recompensa-destaque-icone"));
        destaque.appendChild(vazio);
    }

    catalogoRecompensas.forEach(function(recompensa) {
        const adquirida = recompensasAdquiridas.includes(recompensa.id);
        const cartao = document.createElement("article");
        cartao.className = "recompensa-card";

        const cabecalho = document.createElement("div");
        cabecalho.className = "recompensa-card-cabecalho";
        cabecalho.appendChild(criarElementoRecompensa(recompensa, "recompensa-card-icone"));

        const categoria = document.createElement("span");
        categoria.className = "recompensa-categoria";
        categoria.textContent = recompensa.categoria;
        cabecalho.appendChild(categoria);

        const nome = document.createElement("h4");
        nome.textContent = recompensa.nome;

        const descricao = document.createElement("p");
        descricao.textContent = recompensa.descricao;

        const rodape = document.createElement("div");
        rodape.className = "recompensa-card-rodape";

        const custo = document.createElement("strong");
        custo.textContent = recompensa.custo + " pts";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = adquirida ? "Desbloqueada" : "Resgatar prêmio";
        botao.disabled = adquirida;
        botao.onclick = function() {
            resgatarRecompensa(recompensa.id);
        };

        rodape.append(custo, botao);
        cartao.append(cabecalho, nome, descricao, rodape);
        loja.appendChild(cartao);
    });

    if (recompensasAdquiridas.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "colecao-vazia";
        vazio.textContent = "Sua coleção ainda está vazia. Acerte desafios para ganhar pontos e resgatar sua primeira conquista.";
        colecao.appendChild(vazio);
        return;
    }

    recompensasAdquiridas.forEach(function(id) {
        const recompensa = catalogoRecompensas.find(function(item) {
            return item.id === id;
        });

        if (!recompensa) {
            return;
        }

        const cartao = document.createElement("article");
        cartao.className = "recompensa-colecao-item";
        cartao.appendChild(criarElementoRecompensa(recompensa, "recompensa-colecao-icone"));

        const nome = document.createElement("strong");
        nome.textContent = recompensa.nome;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = dados.perfil.recompensaAtiva === id ? "Em destaque" : "Destacar";
        botao.disabled = dados.perfil.recompensaAtiva === id;
        botao.onclick = function() {
            destacarRecompensa(id);
        };

        cartao.append(nome, botao);
        colecao.appendChild(cartao);
    });

}


function resgatarRecompensa(id) {

    const recompensa = catalogoRecompensas.find(function(item) {
        return item.id === id;
    });
    const dados = carregarContaRecompensas();
    const mensagem = document.getElementById("mensagemRecompensas");

    if (!recompensa || !dados) {
        return;
    }

    if (dados.perfil.colecao.includes(id)) {
        mensagem.textContent = "Essa recompensa já está na sua coleção.";
        return;
    }

    if (dados.perfil.pontos < recompensa.custo) {
        mensagem.textContent = "Faltam " + (recompensa.custo - dados.perfil.pontos) + " pontos para resgatar " + recompensa.nome + ".";
        return;
    }

    dados.perfil.pontos -= recompensa.custo;
    dados.perfil.colecao.push(id);
    dados.perfil.recompensaAtiva = id;
    salvarContasRecompensas(dados.contas);

    mensagem.textContent = recompensa.nome + " foi desbloqueada e está em destaque!";
    atualizarRecompensas();

}


function destacarRecompensa(id) {

    const dados = carregarContaRecompensas();
    const recompensa = catalogoRecompensas.find(function(item) {
        return item.id === id;
    });

    if (!dados || !recompensa || !dados.perfil.colecao.includes(id)) {
        return;
    }

    dados.perfil.recompensaAtiva = id;
    salvarContasRecompensas(dados.contas);
    document.getElementById("mensagemRecompensas").textContent = recompensa.nome + " agora está em destaque no seu perfil.";
    atualizarRecompensas();

}


/* =========================================
   MODAL
========================================= */

function abrirModal(jogo) {

    limparTemporizadoresDesafios();
    const modal = document.getElementById("modalJogo");

    document.querySelectorAll(".jogo-area").forEach(function(area) {

        area.classList.remove("ativo");

    });


    document.getElementById(jogo).classList.add("ativo");

    modal.classList.add("ativo");

}


function fecharJogo() {

    limparTemporizadoresDesafios();

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
   DESAFIOS MATEMÁTICOS
========================================= */

const problemasEstrategia = [
    {
        tema: "ORDEM DAS OPERAÇÕES",
        pergunta: "A equipe prepara 3 kits. Cada kit tem 48 barras de energia e recebe mais 27. Quantas barras há nos 3 kits?",
        opcoes: ["171", "225", "252", "144"],
        resposta: "225",
        explicacao: "Cada kit tem 48 + 27 = 75 barras. Para 3 kits: 3 × 75 = 225 barras."
    },
    {
        tema: "FRAÇÕES",
        pergunta: "Uma volta tem 400 m. A corredora já completou 5/8 do percurso. Quantos metros faltam para terminar a volta?",
        opcoes: ["150 m", "250 m", "125 m", "275 m"],
        resposta: "150 m",
        explicacao: "5/8 de 400 = 250 m percorridos. Faltam 400 − 250 = 150 m."
    },
    {
        tema: "MEDIDAS E DECIMAIS",
        pergunta: "Um treino tem 2,4 km pela manhã e mais 850 m à tarde. Qual é a distância total em metros?",
        opcoes: ["3.250 m", "2.485 m", "3.400 m", "2.950 m"],
        resposta: "3.250 m",
        explicacao: "2,4 km = 2.400 m. Então, 2.400 + 850 = 3.250 m."
    },
    {
        tema: "PORCENTAGEM",
        pergunta: "Em uma corrida com 240 participantes, 15% escolheram a prova de 5 km. Quantas pessoas escolheram essa prova?",
        opcoes: ["24", "36", "40", "48"],
        resposta: "36",
        explicacao: "10% de 240 são 24; 5% são 12. Logo, 15% = 24 + 12 = 36 pessoas."
    },
    {
        tema: "GEOMETRIA · ÁREA",
        pergunta: "Uma área de aquecimento retangular mede 120 m de comprimento por 45 m de largura. Qual é a área?",
        opcoes: ["330 m²", "5.400 m²", "3.300 m²", "10.800 m²"],
        resposta: "5.400 m²",
        explicacao: "A área do retângulo é comprimento × largura: 120 × 45 = 5.400 m²."
    },
    {
        tema: "MÉDIA E DIVISÃO",
        pergunta: "Uma atleta corre 6 voltas de 400 m em 12 minutos, sempre no mesmo ritmo. Quantos minutos leva por volta?",
        opcoes: ["1,5 min", "2 min", "2,4 min", "3 min"],
        resposta: "2 min",
        explicacao: "Divida o tempo total pelas voltas: 12 ÷ 6 = 2 minutos por volta."
    },
    {
        tema: "EQUAÇÕES",
        pergunta: "O placar de treino mostra 3n + 12 pontos. Se o total é 42, qual é o valor de n?",
        opcoes: ["8", "9", "10", "14"],
        resposta: "10",
        explicacao: "Subtraia 12 dos dois lados: 3n = 30. Depois, 30 ÷ 3 = 10."
    },
    {
        tema: "PROPORÇÃO",
        pergunta: "Uma equipe percorreu 3/4 de quilômetro em cada um de 4 trechos iguais. Qual foi a distância total?",
        opcoes: ["2 km", "2,5 km", "3 km", "4 km"],
        resposta: "3 km",
        explicacao: "Quatro trechos de 3/4 km: 4 × 3/4 = 12/4 = 3 km."
    }
];

const problemasSprint = [
    { tema: "FRAÇÕES", pergunta: "Quanto é 3/4 de 120?", resposta: 90, explicacao: "Divida 120 por 4 e multiplique por 3: 30 × 3 = 90." },
    { tema: "ORDEM DAS OPERAÇÕES", pergunta: "Resolva: 5 + 2 × (18 − 11).", resposta: 19, explicacao: "Parênteses primeiro: 18 − 11 = 7. Depois, 5 + 2 × 7 = 19." },
    { tema: "PORCENTAGEM", pergunta: "Uma inscrição custa R$ 240. Quanto é 15% desse valor?", resposta: 36, explicacao: "10% de 240 são 24 e 5% são 12; juntos, 15% são 36." },
    { tema: "CONVERSÃO DE MEDIDAS", pergunta: "Converta 2,5 km para metros.", resposta: 2500, explicacao: "Cada quilômetro tem 1.000 metros: 2,5 × 1.000 = 2.500 m." },
    { tema: "EQUAÇÕES", pergunta: "Se 4x + 7 = 39, quanto vale x?", resposta: 8, explicacao: "39 − 7 = 32; depois, 32 ÷ 4 = 8." },
    { tema: "GEOMETRIA · ÁREA", pergunta: "Qual é a área de um retângulo de 18 m por 7 m?", resposta: 126, explicacao: "Área do retângulo = base × altura: 18 × 7 = 126 m²." },
    { tema: "PORCENTAGEM", pergunta: "Uma equipe completou 35% de 200 voltas de treino. Quantas voltas foram?", resposta: 70, explicacao: "35% = 0,35; então, 0,35 × 200 = 70 voltas." },
    { tema: "DECIMAIS", pergunta: "Calcule: 1,2 + 0,85.", resposta: 2.05, explicacao: "Alinhe as casas decimais: 1,20 + 0,85 = 2,05." },
    { tema: "PROPORÇÃO", pergunta: "Uma equipe percorre 1,5 km em cada trecho. Qual a distância após 4 trechos?", resposta: 6, explicacao: "Quatro trechos de 1,5 km: 1,5 × 4 = 6 km." },
    { tema: "MÉDIA", pergunta: "Qual é a média de 6, 8, 10, 12 e 14?", resposta: 10, explicacao: "Some os valores (50) e divida pela quantidade (5): 50 ÷ 5 = 10." },
    { tema: "RAZÃO", pergunta: "A razão entre corredores iniciantes e experientes é 3:5. Se há 32 atletas, quantos são iniciantes?", resposta: 12, explicacao: "São 8 partes ao todo; 32 ÷ 8 = 4 atletas por parte. Iniciantes: 3 × 4 = 12." },
    { tema: "GEOMETRIA · PERÍMETRO", pergunta: "Um quadrado tem perímetro de 52 cm. Quanto mede cada lado?", resposta: 13, explicacao: "O quadrado tem 4 lados iguais: 52 ÷ 4 = 13 cm." }
];

let etapaEstrategia = 0;
let pontosEstrategia = 0;
let sequenciaEstrategia = 0;
let respostasEstrategiaBloqueadas = false;
let pontosSprint = 0;
let sequenciaSprint = 0;
let etapaSprint = 0;
let acertosSprint = 0;
let tempoSprint = 75;
let filaSprint = [];
let respostasSprintBloqueadas = false;
let sprintFinalizado = false;
let intervaloSprint = null;
let temporizadorDesafio = null;

function limparTemporizadoresDesafios() {
    if (temporizadorDesafio) {
        clearTimeout(temporizadorDesafio);
        temporizadorDesafio = null;
    }
    if (intervaloSprint) {
        clearInterval(intervaloSprint);
        intervaloSprint = null;
    }
}

function atualizarPlacarDesafio(id, pontos) {
    document.getElementById(id).textContent = pontos + " pts";
}

function atualizarTrilhoDesafio(id, progresso) {
    document.getElementById(id).style.width = Math.min(progresso, 100) + "%";
}

function mostrarFimDesafio(elemento, titulo, texto, reiniciar) {
    elemento.replaceChildren();
    const tituloFim = document.createElement("h3");
    tituloFim.textContent = titulo;
    const resumo = document.createElement("p");
    resumo.textContent = texto;
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-jogo";
    botao.textContent = "Correr mais uma →";
    botao.onclick = reiniciar;
    elemento.append(tituloFim, resumo, botao);
    elemento.hidden = false;
}

function abrirEstrategia() {
    limparTemporizadoresDesafios();
    etapaEstrategia = 0;
    pontosEstrategia = 0;
    sequenciaEstrategia = 0;
    respostasEstrategiaBloqueadas = false;
    document.getElementById("fimEstrategia").hidden = true;
    document.getElementById("feedbackEstrategia").textContent = "";
    atualizarPlacarDesafio("pontosEstrategia", 0);
    abrirModal("estrategia");
    mostrarEtapaEstrategia();
}

function mostrarEtapaEstrategia() {
    if (etapaEstrategia >= problemasEstrategia.length) {
        finalizarEstrategia();
        return;
    }
    const problema = problemasEstrategia[etapaEstrategia];
    document.getElementById("etapaEstrategia").textContent =
        "ETAPA " + (etapaEstrategia + 1) + " DE " + problemasEstrategia.length;
    document.getElementById("sequenciaEstrategia").textContent =
        "SEQUÊNCIA " + sequenciaEstrategia;
    document.getElementById("temaEstrategia").textContent = problema.tema;
    document.getElementById("perguntaEstrategia").textContent = problema.pergunta;
    document.getElementById("feedbackEstrategia").textContent = "";
    document.getElementById("feedbackEstrategia").className = "desafio-feedback";
    document.getElementById("fimEstrategia").hidden = true;
    atualizarTrilhoDesafio("barraEstrategia", etapaEstrategia / problemasEstrategia.length * 100);

    const respostas = document.getElementById("respostasEstrategia");
    respostas.replaceChildren();
    problema.opcoes.forEach(function(opcao) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "resposta-estrategia";
        botao.textContent = opcao;
        botao.onclick = function() {
            responderEstrategia(opcao);
        };
        respostas.appendChild(botao);
    });
}

function responderEstrategia(resposta) {
    if (respostasEstrategiaBloqueadas || etapaEstrategia >= problemasEstrategia.length) return;

    respostasEstrategiaBloqueadas = true;
    const problema = problemasEstrategia[etapaEstrategia];
    const acertou = resposta === problema.resposta;
    const botoes = document.querySelectorAll("#respostasEstrategia button");

    botoes.forEach(function(botao) {
        botao.disabled = true;
        if (botao.textContent === problema.resposta) botao.classList.add("resposta-correta");
        if (!acertou && botao.textContent === resposta) botao.classList.add("resposta-incorreta");
    });

    const feedback = document.getElementById("feedbackEstrategia");
    if (acertou) {
        sequenciaEstrategia++;
        const ganho = 10 + (sequenciaEstrategia > 1 ? 5 : 0);
        pontosEstrategia += ganho;
        feedback.textContent = "🏁 Certo! +" + ganho + " pts. " + problema.explicacao;
        feedback.classList.add("feedback-correto");
        registrarPontuacao(ganho);
        registrarPontosTreino(ganho);
    } else {
        sequenciaEstrategia = 0;
        feedback.textContent = "Confira a estratégia: " + problema.explicacao;
        feedback.classList.add("feedback-incorreto");
    }

    atualizarPlacarDesafio("pontosEstrategia", pontosEstrategia);
    document.getElementById("sequenciaEstrategia").textContent = "SEQUÊNCIA " + sequenciaEstrategia;
    etapaEstrategia++;
    temporizadorDesafio = setTimeout(function() {
        temporizadorDesafio = null;
        respostasEstrategiaBloqueadas = false;
        mostrarEtapaEstrategia();
    }, 1350);
}

function finalizarEstrategia() {
    atualizarTrilhoDesafio("barraEstrategia", 100);
    document.getElementById("respostasEstrategia").replaceChildren();
    document.getElementById("feedbackEstrategia").textContent = "";
    mostrarFimDesafio(
        document.getElementById("fimEstrategia"),
        "🏆 Circuito concluído!",
        "Você terminou as 8 etapas e somou " + pontosEstrategia + " pontos. Cada problema resolvido fortalece sua estratégia.",
        abrirEstrategia
    );
}

function abrirSprintMental() {
    limparTemporizadoresDesafios();
    pontosSprint = 0;
    sequenciaSprint = 0;
    etapaSprint = 0;
    acertosSprint = 0;
    tempoSprint = 75;
    sprintFinalizado = false;
    respostasSprintBloqueadas = false;
    filaSprint = problemasSprint.slice();
    for (let indice = filaSprint.length - 1; indice > 0; indice--) {
        const aleatorio = Math.floor(Math.random() * (indice + 1));
        [filaSprint[indice], filaSprint[aleatorio]] = [filaSprint[aleatorio], filaSprint[indice]];
    }
    filaSprint = filaSprint.slice(0, 10);
    document.getElementById("fimSprint").hidden = true;
    document.getElementById("feedbackSprint").textContent = "";
    document.getElementById("formSprint").hidden = false;
    document.getElementById("respostaSprint").disabled = false;
    document.getElementById("respostaSprint").value = "";
    document.getElementById("tempoSprint").textContent = tempoSprint;
    atualizarPlacarDesafio("pontosSprint", 0);
    abrirModal("sprintMental");
    mostrarEtapaSprint();
    intervaloSprint = setInterval(function() {
        tempoSprint--;
        document.getElementById("tempoSprint").textContent = tempoSprint;
        if (tempoSprint <= 10) document.querySelector(".sprint-tempo").classList.add("sprint-tempo-alerta");
        if (tempoSprint <= 0) finalizarSprintMental();
    }, 1000);
}

function mostrarEtapaSprint() {
    if (etapaSprint >= filaSprint.length) {
        finalizarSprintMental();
        return;
    }
    const problema = filaSprint[etapaSprint];
    document.getElementById("temaSprint").textContent = problema.tema;
    document.getElementById("perguntaSprint").textContent = problema.pergunta;
    document.getElementById("etapaSprint").textContent = "ETAPA " + (etapaSprint + 1) + " DE " + filaSprint.length;
    document.getElementById("sequenciaSprint").textContent = "SEQUÊNCIA " + sequenciaSprint;
    document.getElementById("feedbackSprint").textContent = "";
    document.getElementById("feedbackSprint").className = "desafio-feedback";
    document.getElementById("respostaSprint").value = "";
    document.getElementById("respostaSprint").focus();
    document.getElementById("respostaSprint").disabled = false;
    atualizarTrilhoDesafio("barraSprint", etapaSprint / filaSprint.length * 100);
}

function responderSprintMental(event) {
    event.preventDefault();
    if (sprintFinalizado || respostasSprintBloqueadas || etapaSprint >= filaSprint.length) return;

    const campo = document.getElementById("respostaSprint");
    const valorDigitado = campo.value.trim().replace(",", ".");
    const valor = Number(valorDigitado);
    if (valorDigitado === "" || !Number.isFinite(valor)) {
        document.getElementById("feedbackSprint").textContent = "Digite um número válido para registrar sua resposta.";
        document.getElementById("feedbackSprint").className = "desafio-feedback feedback-incorreto";
        return;
    }

    respostasSprintBloqueadas = true;
    campo.disabled = true;
    const problema = filaSprint[etapaSprint];
    const acertou = Math.abs(valor - problema.resposta) < 0.001;
    const feedback = document.getElementById("feedbackSprint");

    if (acertou) {
        acertosSprint++;
        sequenciaSprint++;
        const ganho = 15 + (sequenciaSprint > 1 ? 5 : 0);
        pontosSprint += ganho;
        feedback.textContent = "⚡ Na mosca! +" + ganho + " pts. " + problema.explicacao;
        feedback.classList.add("feedback-correto");
        registrarPontuacao(ganho);
        registrarPontosTreino(ganho);
    } else {
        sequenciaSprint = 0;
        feedback.textContent = "A resposta era " + String(problema.resposta).replace(".", ",") + ". " + problema.explicacao;
        feedback.classList.add("feedback-incorreto");
    }

    etapaSprint++;
    atualizarPlacarDesafio("pontosSprint", pontosSprint);
    document.getElementById("etapaSprint").textContent =
        etapaSprint >= filaSprint.length ? "LINHA DE CHEGADA" : "ETAPA " + etapaSprint + " DE " + filaSprint.length;
    document.getElementById("sequenciaSprint").textContent = "SEQUÊNCIA " + sequenciaSprint;
    atualizarTrilhoDesafio("barraSprint", etapaSprint / filaSprint.length * 100);
    temporizadorDesafio = setTimeout(function() {
        temporizadorDesafio = null;
        respostasSprintBloqueadas = false;
        if (!sprintFinalizado) mostrarEtapaSprint();
    }, 700);
}

function finalizarSprintMental() {
    if (sprintFinalizado) return;
    sprintFinalizado = true;
    limparTemporizadoresDesafios();
    document.getElementById("formSprint").hidden = true;
    document.getElementById("respostaSprint").disabled = true;
    atualizarTrilhoDesafio("barraSprint", etapaSprint / filaSprint.length * 100);
    const totalRespondido = etapaSprint;
    document.getElementById("etapaSprint").textContent = "BANDEIRADA · " + totalRespondido + " RESPONDIDAS";
    document.getElementById("feedbackSprint").textContent = "";
    document.querySelector(".sprint-tempo").classList.remove("sprint-tempo-alerta");
    mostrarFimDesafio(
        document.getElementById("fimSprint"),
        tempoSprint > 0 ? "🏁 Linha de chegada!" : "⏱ Tempo encerrado!",
        "Você marcou " + pontosSprint + " pontos, acertou " + acertosSprint + " de " + totalRespondido + " desafios e terminou com " + tempoSprint + " segundos no relógio.",
        abrirSprintMental
    );
}

document.getElementById("formSprint").addEventListener("submit", responderSprintMental);


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
    { id: "olympikus-corre-4", marca: "Olympikus", modelo: "Corre 4 · Maratona POA", categoria: "Corrida", meta: 25, imagem: "./assets/tenis/olympikus-corre-4.jpg", fonte: "Olympikus" },
    { id: "adidas-adios-pro", marca: "adidas", modelo: "Adizero Adios Pro 4", categoria: "Velocidade", meta: 26.5, imagem: "./assets/tenis/adidas-adios-pro-4.jpg", fonte: "adidas" },
    { id: "adidas-adios-pro-3", marca: "adidas", modelo: "Adizero Adios Pro 3", categoria: "Velocidade", meta: 28, imagem: "./assets/tenis/adidas-adios-pro-3.jpg", fonte: "Wikimedia Commons", atribuicao: "Pangalau", licencaUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
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
    if (tenis.licencaUrl) {
        const linkLicenca = document.createElement("a");
        linkLicenca.href = tenis.licencaUrl;
        linkLicenca.target = "_blank";
        linkLicenca.rel = "noopener noreferrer";
        linkLicenca.textContent = "CC BY-SA 4.0";
        notaFoto.append(
            document.createTextNode("Foto: " + tenis.atribuicao + " / " + tenis.fonte + " · "),
            linkLicenca,
            document.createTextNode(". Prêmio digital.")
        );
    } else {
        notaFoto.textContent = "Foto real ilustrativa · " + tenis.fonte + ". Prêmio digital.";
    }

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
    registrarPontosTreino(10);
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
        registrarPontosTreino(pontos);

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
    const buscaAcessivel = document.body.classList.contains("apoio-visual-surdo")
        ? busca + " com legenda em português"
        : busca;

    const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(buscaAcessivel);

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

        iniciarComunidade();
        iniciarPitStopMatematico();
        iniciarClubePro();
        iniciarAcessibilidade();

        const emailSalvo =
            localStorage.getItem("mathzoneEmail");


        if (emailSalvo) {

            document.getElementById("telaLogin").style.display =
                "none";

            document
                .getElementById("sitePrincipal")
                .classList.add("visivel");

            sincronizarVideosReels("inicio");

        } else {

            document.getElementById("telaLogin").style.display =
                "flex";

        }

    }
);