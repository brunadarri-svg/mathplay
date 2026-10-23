# Mente Turbo

## Executar com PHP e MySQL no Laragon

1. Inicie o MySQL no Laragon.
2. Importe `database/schema.sql` pelo HeidiSQL ou phpMyAdmin. O arquivo cria o banco `mente_turbo` e as tabelas de contas, dados dos alunos e atividades.
3. Copie `config.local.php.example` para `config.local.php` na pasta principal do projeto e informe a senha do usuário MySQL, se houver. Esse arquivo local é ignorado pelo Git.
4. Abra `mathzone/abrir-mente-turbo.bat`. O site será servido pelo PHP em `http://127.0.0.1:8788/`.

O cadastro, as sessões, os pontos, o ranking, o progresso dos jogos e as atividades de turma ficam no MySQL. Quando uma conta antiga entrar pelo navegador onde foi criada, os dados de progresso e os pontos serão importados; atividades antigas são importadas quando as contas de professor e aluno já estiverem no banco. Preferências de acessibilidade continuam no navegador. O visual, os vídeos e os jogos permanecem na pasta `mathzone`.

Para publicar, configure os segredos `DB_HOST`, `DB_NAME`, `DB_USER` e `DB_PASS` no GitHub, além das credenciais de FTP já usadas pelo fluxo de publicação. Use HTTPS no servidor para proteger as credenciais durante o acesso.
