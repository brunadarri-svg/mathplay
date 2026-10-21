const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const siteRoot = __dirname;
const host = "127.0.0.1";
const port = 8787;
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml"
};

function responderComErro(resposta, status, mensagem) {
    resposta.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    resposta.end(mensagem);
}

function resolverArquivo(caminhoUrl) {
    let caminhoDecodificado;

    try {
        caminhoDecodificado = decodeURIComponent(caminhoUrl);
    } catch (erro) {
        return null;
    }

    const caminhoRelativo = caminhoDecodificado === "/"
        ? "index.html"
        : caminhoDecodificado.replace(/^[/\\]+/, "");
    const arquivo = path.resolve(siteRoot, caminhoRelativo);

    if (arquivo !== siteRoot && !arquivo.startsWith(siteRoot + path.sep)) {
        return null;
    }

    return arquivo;
}

const servidor = http.createServer(function(pedido, resposta) {
    if (pedido.method !== "GET" && pedido.method !== "HEAD") {
        responderComErro(resposta, 405, "Método não permitido.");
        return;
    }

    const arquivo = resolverArquivo(new URL(pedido.url, "http://" + host).pathname);
    if (!arquivo) {
        responderComErro(resposta, 400, "Endereço inválido.");
        return;
    }

    fs.stat(arquivo, function(erro, informacao) {
        if (erro || !informacao.isFile()) {
            responderComErro(resposta, 404, "Arquivo não encontrado.");
            return;
        }

        const tipo = contentTypes[path.extname(arquivo).toLowerCase()] || "application/octet-stream";
        resposta.setHeader("Content-Type", tipo);
        resposta.setHeader("Accept-Ranges", "bytes");

        if (pedido.headers.range && tipo === "video/mp4") {
            const intervalo = /^bytes=(\d*)-(\d*)$/.exec(pedido.headers.range);
            if (!intervalo || (!intervalo[1] && !intervalo[2])) {
                resposta.setHeader("Content-Range", "bytes */" + informacao.size);
                responderComErro(resposta, 416, "Intervalo de vídeo inválido.");
                return;
            }

            const sufixo = !intervalo[1];
            const quantidade = Number(sufixo ? intervalo[2] : intervalo[1]);
            const inicio = sufixo
                ? Math.max(informacao.size - quantidade, 0)
                : quantidade;
            const fimSolicitado = sufixo ? informacao.size - 1 : Number(intervalo[2] || informacao.size - 1);
            const fim = Math.min(fimSolicitado, informacao.size - 1);

            if (inicio >= informacao.size || inicio > fim) {
                resposta.setHeader("Content-Range", "bytes */" + informacao.size);
                responderComErro(resposta, 416, "Intervalo de vídeo fora do arquivo.");
                return;
            }

            resposta.writeHead(206, {
                "Content-Range": "bytes " + inicio + "-" + fim + "/" + informacao.size,
                "Content-Length": fim - inicio + 1
            });

            if (pedido.method === "HEAD") {
                resposta.end();
                return;
            }

            fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(resposta);
            return;
        }

        resposta.setHeader("Content-Length", informacao.size);
        resposta.writeHead(200);

        if (pedido.method === "HEAD") {
            resposta.end();
            return;
        }

        fs.createReadStream(arquivo).pipe(resposta);
    });
});

servidor.on("error", function(erro) {
    console.error("Não foi possível iniciar o servidor local:", erro.message);
    process.exitCode = 1;
});

servidor.listen(port, host, function() {
    console.log("Mente Turbo disponível em http://" + host + ":" + port);
    console.log("Mantenha esta janela aberta enquanto usa o site.");
});
