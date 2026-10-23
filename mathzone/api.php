<?php
declare(strict_types=1);

ini_set('session.use_strict_mode', '1');
session_name('mente_turbo_session');
session_set_cookie_params([
    'httponly' => true,
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Strict',
    'path' => '/'
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function responder(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function lerEntrada(): array
{
    $entrada = file_get_contents('php://input');
    if ($entrada === false || strlen($entrada) > 300000) {
        responder(413, ['ok' => false, 'mensagem' => 'A solicitação é inválida ou muito grande.']);
    }

    try {
        $dados = json_decode($entrada, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        responder(400, ['ok' => false, 'mensagem' => 'Não foi possível ler os dados enviados.']);
    }

    if (!is_array($dados)) {
        responder(400, ['ok' => false, 'mensagem' => 'Os dados enviados não possuem o formato esperado.']);
    }

    return $dados;
}

function exigirSessao(): array
{
    if (!isset($_SESSION['user_id'], $_SESSION['email'], $_SESSION['account_type'])) {
        responder(401, ['ok' => false, 'mensagem' => 'Entre na sua conta para continuar.']);
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'email' => (string) $_SESSION['email'],
        'name' => (string) $_SESSION['name'],
        'accountType' => (string) $_SESSION['account_type']
    ];
}

function validarTokenCsrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !isset($_SESSION['csrf_token']) ||
        !hash_equals((string) $_SESSION['csrf_token'], $token)) {
        responder(403, ['ok' => false, 'mensagem' => 'A sessão expirou. Atualize a página e tente novamente.']);
    }
}

function chaveEstadoPermitida(string $chave): bool
{
    return in_array($chave, [
        'mathzoneComunidade',
        'mathzoneContasPets',
        'mathzoneRecordesCorrida',
        'mathzoneColecaoTenisCorrida'
    ], true) || preg_match(
        '/^mathzoneDesafioPista:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}:\d{4}-\d{2}-\d{2}$/i',
        $chave
    ) === 1;
}

try {
    $configuracao = require dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php';
    $pdo = new PDO(
        'mysql:host=' . $configuracao['host'] . ';dbname=' . $configuracao['name'] . ';charset=utf8mb4',
        $configuracao['user'],
        $configuracao['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (Throwable $erro) {
    error_log('Mente Turbo: não foi possível conectar ao banco de dados: ' . $erro->getMessage());
    responder(503, ['ok' => false, 'mensagem' => 'Não foi possível conectar ao banco de dados. Confira a configuração do MySQL.']);
}

$acao = (string) ($_GET['action'] ?? '');
$metodo = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($metodo === 'GET' && $acao === 'session') {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    $conta = null;
    if (isset($_SESSION['user_id'])) {
        $conta = exigirSessao();
    }

    responder(200, [
        'ok' => true,
        'csrfToken' => $_SESSION['csrf_token'],
        'conta' => $conta
    ]);
}

if (!in_array($metodo, ['GET', 'POST'], true)) {
    responder(405, ['ok' => false, 'mensagem' => 'Método não permitido.']);
}

$dados = $metodo === 'POST' ? lerEntrada() : [];
if ($metodo === 'POST') {
    validarTokenCsrf();
}

try {
    if ($acao === 'register') {
        $nome = trim((string) ($dados['nome'] ?? ''));
        $email = strtolower(trim((string) ($dados['email'] ?? '')));
        $senha = (string) ($dados['senha'] ?? '');
        $tipo = (string) ($dados['tipoConta'] ?? 'aluno');

        if (mb_strlen($nome) < 2 || mb_strlen($nome) > 40 ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            strlen($senha) < 8 || !in_array($tipo, ['aluno', 'professor'], true)) {
            responder(422, ['ok' => false, 'mensagem' => 'Confira seu nome, e-mail, tipo de conta e senha com pelo menos 8 caracteres.']);
        }

        $consulta = $pdo->prepare(
            'INSERT INTO users (name, email, password_hash, account_type) VALUES (?, ?, ?, ?)'
        );
        try {
            $consulta->execute([$nome, $email, password_hash($senha, PASSWORD_DEFAULT), $tipo]);
        } catch (PDOException $erro) {
            if ($erro->getCode() === '23000') {
                responder(409, [
                    'ok' => false,
                    'codigo' => 'email_existente',
                    'mensagem' => 'Já existe uma conta com esse e-mail. Entre ou use outro e-mail.'
                ]);
            }
            throw $erro;
        }

        responder(201, ['ok' => true]);
    }

    if ($acao === 'login') {
        $email = strtolower(trim((string) ($dados['email'] ?? '')));
        $senha = (string) ($dados['senha'] ?? '');
        $consulta = $pdo->prepare(
            'SELECT id, name, email, password_hash, account_type FROM users WHERE email = ? LIMIT 1'
        );
        $consulta->execute([$email]);
        $conta = $consulta->fetch();

        if (!$conta || !password_verify($senha, $conta['password_hash'])) {
            responder(401, ['ok' => false, 'codigo' => 'login_invalido', 'mensagem' => 'E-mail ou senha incorretos. Confira os dados e tente novamente.']);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $conta['id'];
        $_SESSION['email'] = (string) $conta['email'];
        $_SESSION['name'] = (string) $conta['name'];
        $_SESSION['account_type'] = (string) $conta['account_type'];
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        responder(200, [
            'ok' => true,
            'conta' => [
                'id' => (int) $conta['id'],
                'nome' => (string) $conta['name'],
                'email' => (string) $conta['email'],
                'tipoConta' => (string) $conta['account_type']
            ],
            'csrfToken' => $_SESSION['csrf_token']
        ]);
    }

    if ($acao === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $parametros = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $parametros['path'],
                'domain' => $parametros['domain'],
                'secure' => $parametros['secure'],
                'httponly' => $parametros['httponly'],
                'samesite' => 'Strict'
            ]);
        }
        session_destroy();
        responder(200, ['ok' => true]);
    }

    $conta = exigirSessao();

    if ($acao === 'state:read') {
        $consulta = $pdo->prepare('SELECT state_key, state_value FROM user_state WHERE user_id = ?');
        $consulta->execute([$conta['id']]);
        $estado = [];
        foreach ($consulta->fetchAll() as $item) {
            $estado[$item['state_key']] = json_decode($item['state_value'], true, 32, JSON_THROW_ON_ERROR);
        }
        responder(200, ['ok' => true, 'estado' => $estado]);
    }

    if ($acao === 'state:write') {
        $chave = (string) ($dados['chave'] ?? '');
        if (!chaveEstadoPermitida($chave) || !array_key_exists('valor', $dados)) {
            responder(422, ['ok' => false, 'mensagem' => 'Este dado não pode ser salvo.']);
        }

        $valor = json_encode($dados['valor'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $consulta = $pdo->prepare(
            'INSERT INTO user_state (user_id, state_key, state_value) VALUES (?, ?, ?) '
            . 'ON DUPLICATE KEY UPDATE state_value = VALUES(state_value)'
        );
        $consulta->execute([$conta['id'], $chave, $valor]);
        responder(200, ['ok' => true]);
    }

    if ($acao === 'ranking') {
        $consulta = $pdo->query(
            'SELECT email, points AS pontos FROM users WHERE points > 0 ORDER BY points DESC, name ASC LIMIT 100'
        );
        responder(200, ['ok' => true, 'ranking' => $consulta->fetchAll()]);
    }

    if ($acao === 'points:add') {
        $pontos = filter_var($dados['pontos'] ?? null, FILTER_VALIDATE_INT);
        if ($pontos === false || $pontos < 1 || $pontos > 1000) {
            responder(422, ['ok' => false, 'mensagem' => 'A quantidade de pontos não é válida.']);
        }
        $consulta = $pdo->prepare('UPDATE users SET points = points + ? WHERE id = ?');
        $consulta->execute([$pontos, $conta['id']]);
        responder(200, ['ok' => true]);
    }

    if ($acao === 'students:list') {
        if ($conta['accountType'] !== 'professor') {
            responder(403, ['ok' => false, 'mensagem' => 'Somente professores podem consultar a lista de alunos.']);
        }
        $consulta = $pdo->query(
            "SELECT email, name AS nome FROM users WHERE account_type = 'aluno' ORDER BY name, email"
        );
        responder(200, ['ok' => true, 'alunos' => $consulta->fetchAll()]);
    }

    if ($acao === 'activities:import') {
        $atividadesLegadas = $dados['atividades'] ?? null;
        if (!is_array($atividadesLegadas) || count($atividadesLegadas) > 500) {
            responder(422, ['ok' => false, 'mensagem' => 'A lista de atividades antigas não é válida.']);
        }

        $inserir = $pdo->prepare(
            'INSERT IGNORE INTO activities '
            . '(legacy_id, teacher_id, student_id, prompt, answer, student_answer, attempts, completed_at) '
            . 'VALUES (?, ?, ?, ?, ?, ?, ?, IF(?, CURRENT_TIMESTAMP, NULL))'
        );
        $buscarConta = $pdo->prepare(
            'SELECT id, account_type FROM users WHERE email = ? LIMIT 1'
        );
        $contaImportadora = $conta['email'];
        $tipoImportador = $conta['accountType'];
        $importadas = 0;

        foreach ($atividadesLegadas as $atividade) {
            if (!is_array($atividade)) {
                continue;
            }
            $idLegado = (string) ($atividade['id'] ?? '');
            $emailProfessor = strtolower(trim((string) ($atividade['professorEmail'] ?? '')));
            $emailAluno = strtolower(trim((string) ($atividade['alunoEmail'] ?? '')));
            $pergunta = trim((string) ($atividade['pergunta'] ?? ''));
            $resposta = filter_var($atividade['resposta'] ?? null, FILTER_VALIDATE_FLOAT);
            $tentativas = filter_var($atividade['tentativas'] ?? 0, FILTER_VALIDATE_INT);
            $concluida = ($atividade['concluida'] ?? false) === true;
            $respostaAluno = filter_var($atividade['respostaAluno'] ?? null, FILTER_VALIDATE_FLOAT);

            if ($idLegado === '' || strlen($idLegado) > 80 ||
                !filter_var($emailProfessor, FILTER_VALIDATE_EMAIL) ||
                !filter_var($emailAluno, FILTER_VALIDATE_EMAIL) ||
                ($tipoImportador === 'professor' && $emailProfessor !== $contaImportadora) ||
                ($tipoImportador === 'aluno' && $emailAluno !== $contaImportadora) ||
                $pergunta === '' || mb_strlen($pergunta) > 240 ||
                $resposta === false || !is_finite((float) $resposta) ||
                $tentativas === false || $tentativas < 0 ||
                ($concluida && ($respostaAluno === false || !is_finite((float) $respostaAluno)))) {
                continue;
            }

            $buscarConta->execute([$emailProfessor]);
            $professor = $buscarConta->fetch();
            $buscarConta->execute([$emailAluno]);
            $aluno = $buscarConta->fetch();
            if (!$professor || $professor['account_type'] !== 'professor' ||
                !$aluno || $aluno['account_type'] !== 'aluno') {
                continue;
            }

            $inserir->execute([
                $idLegado,
                (int) $professor['id'],
                (int) $aluno['id'],
                $pergunta,
                $resposta,
                $concluida ? $respostaAluno : null,
                $tentativas,
                $concluida ? 1 : 0
            ]);
            $importadas += $inserir->rowCount();
        }

        responder(200, ['ok' => true, 'importadas' => $importadas]);
    }

    if ($acao === 'activities:list') {
        $coluna = $conta['accountType'] === 'professor' ? 'teacher_id' : 'student_id';
        $consulta = $pdo->prepare(
            'SELECT a.id, t.email AS professorEmail, s.email AS alunoEmail, s.name AS alunoNome, '
            . 'a.prompt AS pergunta, a.answer AS resposta, a.student_answer AS respostaAluno, '
            . 'a.attempts AS tentativas, (a.completed_at IS NOT NULL) AS concluida, a.created_at AS criadaEm '
            . 'FROM activities a JOIN users t ON t.id = a.teacher_id '
            . 'JOIN users s ON s.id = a.student_id WHERE a.' . $coluna . ' = ? ORDER BY a.created_at DESC'
        );
        $consulta->execute([$conta['id']]);
        $atividades = $consulta->fetchAll();
        foreach ($atividades as &$atividade) {
            $atividade['id'] = (string) $atividade['id'];
            $atividade['resposta'] = (float) $atividade['resposta'];
            $atividade['respostaAluno'] = $atividade['respostaAluno'] === null
                ? null
                : (float) $atividade['respostaAluno'];
            $atividade['tentativas'] = (int) $atividade['tentativas'];
            $atividade['concluida'] = (bool) $atividade['concluida'];
            $atividade['criadaEm'] = (string) $atividade['criadaEm'];
        }
        unset($atividade);
        responder(200, ['ok' => true, 'atividades' => $atividades]);
    }

    if ($acao === 'activities:create') {
        if ($conta['accountType'] !== 'professor') {
            responder(403, ['ok' => false, 'mensagem' => 'Somente professores podem enviar atividades.']);
        }
        $alunoEmail = strtolower(trim((string) ($dados['alunoEmail'] ?? '')));
        $pergunta = trim((string) ($dados['pergunta'] ?? ''));
        $resposta = filter_var($dados['resposta'] ?? null, FILTER_VALIDATE_FLOAT);
        if (!filter_var($alunoEmail, FILTER_VALIDATE_EMAIL) ||
            $pergunta === '' || mb_strlen($pergunta) > 240 ||
            $resposta === false || !is_finite((float) $resposta)) {
            responder(422, ['ok' => false, 'mensagem' => 'Confira o aluno, o enunciado e a resposta correta.']);
        }
        $aluno = $pdo->prepare("SELECT id FROM users WHERE email = ? AND account_type = 'aluno' LIMIT 1");
        $aluno->execute([$alunoEmail]);
        $alunoId = $aluno->fetchColumn();
        if ($alunoId === false) {
            responder(404, ['ok' => false, 'mensagem' => 'Não foi encontrada uma conta de aluno para essa atividade.']);
        }
        $inserir = $pdo->prepare(
            'INSERT INTO activities (teacher_id, student_id, prompt, answer) VALUES (?, ?, ?, ?)'
        );
        $inserir->execute([$conta['id'], (int) $alunoId, $pergunta, $resposta]);
        responder(201, ['ok' => true]);
    }

    if ($acao === 'activities:answer') {
        if ($conta['accountType'] !== 'aluno') {
            responder(403, ['ok' => false, 'mensagem' => 'Somente alunos podem responder às atividades.']);
        }
        $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT);
        $resposta = filter_var($dados['resposta'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($id === false || $id < 1 || $resposta === false || !is_finite((float) $resposta)) {
            responder(422, ['ok' => false, 'mensagem' => 'A resposta enviada não é válida.']);
        }

        $pdo->beginTransaction();
        $consulta = $pdo->prepare(
            'SELECT answer, completed_at FROM activities WHERE id = ? AND student_id = ? FOR UPDATE'
        );
        $consulta->execute([$id, $conta['id']]);
        $atividade = $consulta->fetch();
        if (!$atividade || $atividade['completed_at'] !== null) {
            $pdo->rollBack();
            responder(404, ['ok' => false, 'mensagem' => 'Esta atividade não está disponível para resposta.']);
        }
        $correta = abs((float) $atividade['answer'] - (float) $resposta) < 0.0001;
        $atualizar = $pdo->prepare(
            'UPDATE activities SET attempts = attempts + 1, student_answer = ?, '
            . 'completed_at = IF(?, CURRENT_TIMESTAMP, NULL) WHERE id = ?'
        );
        $atualizar->execute([$resposta, $correta ? 1 : 0, $id]);
        $pdo->commit();
        responder(200, ['ok' => true, 'correta' => $correta]);
    }

    responder(404, ['ok' => false, 'mensagem' => 'A operação solicitada não existe.']);
} catch (Throwable $erro) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Mente Turbo: falha na API (' . $acao . '): ' . $erro->getMessage());
    responder(500, ['ok' => false, 'mensagem' => 'Não foi possível concluir a operação. Tente novamente.']);
}
