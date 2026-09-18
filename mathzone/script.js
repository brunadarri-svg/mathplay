/* =========================
   NAVEGAÇÃO
========================= */

function irPara(tela) {

    const telas =
        document.querySelectorAll(".tela");

    telas.forEach(function (item) {
        item.classList.remove("ativa");
    });

    const destino =
        document.getElementById(tela);

    if (destino) {
        destino.classList.add("ativa");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================
   LOGIN
========================= */

function entrarMathZone() {

    const nome =
        document
            .getElementById("nomeLogin")
            .value
            .trim();

    const senha =
        document
            .getElementById("senhaLogin")
            .value
            .trim();

    const mensagem =
        document.getElementById("mensagemLogin");

    if (nome === "" || senha === "") {

        mensagem.style.color = "#f34c9b";

        mensagem.textContent =
            "😊 Preencha seu nome e sua senha!";

        return;
    }

    localStorage.setItem(
        "mathzoneUsuario",
        nome
    );

    mensagem.style.color = "#49a942";

    mensagem.textContent =
        "🎉 Muito bem, " +
        nome +
        "! Entrando...";

    setTimeout(function () {

        const telaLogin =
            document.getElementById("telaLogin");

        if (telaLogin) {
            telaLogin.style.display = "none";
        }

    }, 700);
}


/* =========================
   QUIZ
========================= */

const perguntasQuiz = [

    {
        pergunta: "Quanto é 5 + 3?",
        respostas: ["6", "7", "8", "9"],
        correta: "8"
    },

    {
        pergunta: "Quanto é 10 - 4?",
        respostas: ["5", "6", "7", "8"],
        correta: "6"
    },

    {
        pergunta: "Quanto é 3 × 4?",
        respostas: ["10", "11", "12", "14"],
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

let perguntaAtual = 0;
let pontos = 0;

function abrirQuiz() {

    abrirModal("quiz");

    perguntaAtual = 0;
    pontos = 0;

    mostrarPerguntaQuiz();
}

function mostrarPerguntaQuiz() {

    const pergunta =
        perguntasQuiz[perguntaAtual];

    document.getElementById(
        "quizPergunta"
    ).textContent =
        pergunta.pergunta;

    const respostas =
        document.getElementById(
            "quizRespostas"
        );

    respostas.innerHTML = "";

    pergunta.respostas.forEach(
        function (resposta) {

            const botao =
                document.createElement("button");

            botao.textContent = resposta;

            botao.onclick =
                function () {

                    verificarQuiz(resposta);
                };

            respostas.appendChild(botao);
        }
    );

    document.getElementById(
        "quizPontos"
    ).textContent =
        "Pontos: " + pontos;
}

function verificarQuiz(resposta) {

    const pergunta =
        perguntasQuiz[perguntaAtual];

    const mensagem =
        document.getElementById(
            "quizMensagem"
        );

    if (resposta === pergunta.correta) {

        pontos += 10;

        mensagem.style.color =
            "#49a942";

        mensagem.textContent =
            "🎉 Acertou! Muito bem!";

    } else {

        mensagem.style.color =
            "#f34c9b";

        mensagem.textContent =
            "😊 Quase! A resposta era " +
            pergunta.correta;
    }

    document.getElementById(
        "quizPontos"
    ).textContent =
        "Pontos: " + pontos;

    setTimeout(function () {

        perguntaAtual++;

        if (
            perguntaAtual <
            perguntasQuiz.length
        ) {

            mensagem.textContent = "";

            mostrarPerguntaQuiz();

        } else {

            document.getElementById(
                "quizPergunta"
            ).textContent =
                "🏆 DESAFIO CONCLUÍDO!";

            document.getElementById(
                "quizRespostas"
            ).innerHTML =
                "<p class='resultado'>Você fez " +
                pontos +
                " pontos! 🎉</p>";

        }

    }, 900);
}


/* =========================
   DETETIVE
========================= */

const perguntasDetetive = [

    {
        pista:
            "🕵️ Sou um número. Se você fizer 6 + 6, quem sou eu?",
        resposta: 12
    },

    {
        pista:
            "🔎 Descubra: 5 × 5 = ?",
        resposta: 25
    },

    {
        pista:
            "🔎 Descubra: 6 × 6 = ?",
        resposta: 36
    }

];

let detetivePergunta = 0;
let detetivePontos = 0;

function abrirDetetive() {

    abrirModal("detetive");

    detetivePergunta = 0;

    detetivePontos = 0;

    mostrarDetetive();
}

function mostrarDetetive() {

    const pergunta =
        perguntasDetetive[
            detetivePergunta
        ];

    document.getElementById(
        "detetivePista"
    ).textContent =
        pergunta.pista;

    document.getElementById(
        "respostaDetetive"
    ).value = "";

    document.getElementById(
        "detetiveMensagem"
    ).textContent = "";

    document.getElementById(
        "detetivePontos"
    ).textContent =
        "Pontos: " +
        detetivePontos;
}

function responderDetetive() {

    const valor =
        Number(
            document.getElementById(
                "respostaDetetive"
            ).value
        );

    const pergunta =
        perguntasDetetive[
            detetivePergunta
        ];

    const mensagem =
        document.getElementById(
            "detetiveMensagem"
        );

    if (valor === pergunta.resposta) {

        detetivePontos += 10;

        mensagem.style.color =
            "#49a942";

        mensagem.textContent =
            "🎉 Você descobriu a resposta!";

    } else {

        mensagem.style.color =
            "#f34c9b";

        mensagem.textContent =
            "🔎 Tente novamente!";
        
        return;
    }

    document.getElementById(
        "detetivePontos"
    ).textContent =
        "Pontos: " +
        detetivePontos;

    setTimeout(function () {

        detetivePergunta++;

        if (
            detetivePergunta <
            perguntasDetetive.length
        ) {

            mostrarDetetive();

        } else {

            document.getElementById(
                "detetivePista"
            ).textContent =
                "🏆 Você terminou o desafio!";

            document.getElementById(
                "respostaDetetive"
            ).style.display =
                "none";

            document.querySelector(
                "#detetive button"
            ).style.display =
                "none";

            mensagem.textContent =
                "Você fez " +
                detetivePontos +
                " pontos! 🎉";
        }

    }, 900);
}


/* =========================
   CORRIDA MATEMÁTICA
========================= */

const perguntasCorrida = [

    {
        pergunta: "4 + 4 = ?",
        respostas: ["6", "7", "8", "9"],
        correta: "8"
    },

    {
        pergunta: "9 - 3 = ?",
        respostas: ["5", "6", "7", "8"],
        correta: "6"
    },

    {
        pergunta: "5 × 2 = ?",
        respostas: ["8", "9", "10", "12"],
        correta: "10"
    },

    {
        pergunta: "18 ÷ 3 = ?",
        respostas: ["5", "6", "7", "8"],
        correta: "6"
    }

];

let corridaPergunta = 0;
let posicao = 0;

function abrirCorrida() {

    abrirModal("corrida");

    corridaPergunta = 0;

    posicao = 0;

    atualizarCorredor();

    mostrarPerguntaCorrida();
}

function mostrarPerguntaCorrida() {

    const pergunta =
        perguntasCorrida[
            corridaPergunta
        ];

    document.getElementById(
        "corridaPergunta"
    ).textContent =
        pergunta.pergunta;

    const respostas =
        document.getElementById(
            "corridaRespostas"
        );

    respostas.innerHTML = "";

    pergunta.respostas.forEach(
        function (resposta) {

            const botao =
                document.createElement("button");

            botao.textContent =
                resposta;

            botao.onclick =
                function () {

                    responderCorrida(
                        resposta
                    );
                };

            respostas.appendChild(botao);
        }
    );
}

function responderCorrida(resposta) {

    const pergunta =
        perguntasCorrida[
            corridaPergunta
        ];

    const mensagem =
        document.getElementById(
            "corridaMensagem"
        );

    if (
        resposta ===
        pergunta.correta
    ) {

        posicao++;

        mensagem.style.color =
            "#49a942";

        mensagem.textContent =
            "🚀 Acertou! Você avançou!";

        atualizarCorredor();

    } else {

        mensagem.style.color =
            "#f34c9b";

        mensagem.textContent =
            "😊 Tente novamente!";

        return;
    }

    setTimeout(function () {

        corridaPergunta++;

        if (
            corridaPergunta <
            perguntasCorrida.length
        ) {

            mensagem.textContent = "";

            mostrarPerguntaCorrida();

        } else {

            document.getElementById(
                "corridaPergunta"
            ).textContent =
                "🏁 VOCÊ CHEGOU!";

            document.getElementById(
                "corridaRespostas"
            ).innerHTML =
                "<p class='resultado'>🏆 Parabéns! Você venceu a corrida!</p>";

        }

    }, 800);
}

function atualizarCorredor() {

    const corredor =
        document.getElementById(
            "corredor"
        );

    if (!corredor) {
        return;
    }

    const porcentagem =
        posicao * 28;

    corredor.style.left =
        porcentagem + "%";
}


/* =========================
   MATHRUN
========================= */

const perguntasMathRun = [

    {
        pergunta: "2 + 3 = ?",
        respostas: ["4", "5", "6", "7"],
        correta: "5"
    },

    {
        pergunta: "8 - 3 = ?",
        respostas: ["4", "5", "6", "7"],
        correta: "5"
    },

    {
        pergunta: "4 × 2 = ?",
        respostas: ["6", "7", "8", "9"],
        correta: "8"
    },

    {
        pergunta: "15 ÷ 3 = ?",
        respostas: ["3", "4", "5", "6"],
        correta: "5"
    }

];

let mathrunPergunta = 0;
let mathrunPosicao = 0;
let turboUsado = false;

function abrirMathRun() {

    abrirModal("mathrun");

    mathrunPergunta = 0;

    mathrunPosicao = 0;

    turboUsado = false;

    atualizarMathRun();

    mostrarPerguntaMathRun();
}

function mostrarPerguntaMathRun() {

    const pergunta =
        perguntasMathRun[
            mathrunPergunta
        ];

    document.getElementById(
        "mathrunPergunta"
    ).textContent =
        pergunta.pergunta;

    const respostas =
        document.getElementById(
            "mathrunRespostas"
        );

    respostas.innerHTML = "";

    pergunta.respostas.forEach(
        function (resposta) {

            const botao =
                document.createElement("button");

            botao.textContent =
                resposta;

            botao.onclick =
                function () {

                    responderMathRun(
                        resposta
                    );
                };

            respostas.appendChild(
                botao
            );
        }
    );
}

function responderMathRun(resposta) {

    const pergunta =
        perguntasMathRun[
            mathrunPergunta
        ];

    const mensagem =
        document.getElementById(
            "mathrunMensagem"
        );

    if (
        resposta !==
        pergunta.correta
    ) {

        mensagem.style.color =
            "#f34c9b";

        mensagem.textContent =
            "😊 Errou! Tente a próxima!";

        return;
    }

    mathrunPosicao++;

    mensagem.style.color =
        "#49a942";

    mensagem.textContent =
        "🚀 Acertou! Corra!";

    atualizarMathRun();

    setTimeout(function () {

        mathrunPergunta++;

        if (
            mathrunPergunta <
            perguntasMathRun.length
        ) {

            mensagem.textContent = "";

            mostrarPerguntaMathRun();

        } else {

            document.getElementById(
                "mathrunPergunta"
            ).textContent =
                "🏆 VOCÊ CHEGOU AO FINAL!";

            document.getElementById(
                "mathrunRespostas"
            ).innerHTML =
                "<p class='resultado'>🎉 Parabéns! Você completou o MathRun!</p>";

        }

    }, 800);
}

function atualizarMathRun() {

    const corredor =
        document.getElementById(
            "mathrunCorredor"
        );

    if (!corredor) {
        return;
    }

    let porcentagem =
        mathrunPosicao * 28;

    if (porcentagem > 82) {
        porcentagem = 82;
    }

    corredor.style.left =
        porcentagem + "%";
}

function usarTurbo() {

    if (turboUsado) {

        document.getElementById(
            "mathrunMensagem"
        ).textContent =
            "⚡ Você já usou o TURBO!";

        return;
    }

    turboUsado = true;

    mathrunPosicao++;

    atualizarMathRun();

    document.getElementById(
        "mathrunMensagem"
    ).style.color =
        "#ff9f1c";

    document.getElementById(
        "mathrunMensagem"
    ).textContent =
        "⚡ TURBO ATIVADO! Você avançou!";
}


/* =========================
   MODAL
========================= */

function abrirModal(jogo) {

    const modal =
        document.getElementById(
            "modalJogo"
        );

    const areas =
        document.querySelectorAll(
            ".jogo-area"
        );

    areas.forEach(function (area) {

        area.classList.remove("ativo");

    });

    const areaSelecionada =
        document.getElementById(jogo);

    if (areaSelecionada) {

        areaSelecionada.classList.add(
            "ativo"
        );
    }

    modal.classList.add("ativo");
}

function fecharJogo() {

    document
        .getElementById("modalJogo")
        .classList.remove("ativo");
}


/* =========================
   VÍDEOS
========================= */

function assistirVideo(busca) {

    const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(busca);

    window.open(
        url,
        "_blank"
    );
}


/* =========================
   LOGIN AUTOMÁTICO
========================= */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        const usuario =
            localStorage.getItem(
                "mathzoneUsuario"
            );

        const telaLogin =
            document.getElementById(
                "telaLogin"
            );

        if (
            usuario &&
            telaLogin
        ) {

            telaLogin.style.display =
                "none";
        }

    }
);