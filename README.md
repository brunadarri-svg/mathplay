# Mente Turbo

## Executar com PHP e MySQL no Laragon

1. Na primeira instalação, `abrir-mente-turbo.bat` cria o banco `mente_turbo` e as tabelas a partir de `database/schema.sql`. A preparação pode ser executada novamente sem apagar os dados atuais.
2. Copie `config.local.php.example` para `config.local.php` na pasta principal do projeto e informe a senha do usuário MySQL, se houver. Esse arquivo local é ignorado pelo Git.
3. Abra `abrir-mente-turbo.bat` na pasta principal do projeto. Ele inicia o MySQL do Laragon na porta `3308` se ainda estiver parado, prepara o banco, inicia o PHP e abre `http://127.0.0.1:8788/`. Mantenha abertas as janelas dos serviços enquanto usar o site. Use esse endereço; não abra `index.html` diretamente nem use um servidor estático, pois login e dados dependem da API PHP.

O cadastro, as sessões, os pontos, a classificação geral, os registros do desafio diário de 1 km, o progresso dos jogos e as atividades de turma ficam no MySQL. Cada aluno pode registrar um quilômetro por dia; o registro concede 20 pontos uma única vez por data e atualiza o ranking. A distância é informada pelo próprio aluno, sem verificação por GPS. Quando uma conta antiga entrar pelo navegador onde foi criada, os dados de progresso e os pontos serão importados; atividades antigas são importadas quando as contas de professor e aluno já estiverem no banco. Preferências de acessibilidade continuam no navegador. O visual, os vídeos e os jogos ficam nas pastas de recursos da pasta principal do projeto.

Para publicar, configure os segredos `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASS` no GitHub, além das credenciais de FTP já usadas pelo fluxo de publicação. `DB_PORT` deve ser a porta MySQL do servidor (por exemplo, `3306`). Use HTTPS no servidor para proteger as credenciais durante o acesso.
