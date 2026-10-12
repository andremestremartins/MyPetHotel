# Backend

## Responsabilidades
Base de dados, modelação, autenticação, gestão de utilizadores, animais, serviços e marcações, área de gestão, validações e integração com o Frontend.

---

## Features

### Autenticação e utilizadores
- Registo de cliente (nome, email, password, telemóvel)
- Login e logout
- Passwords guardadas com hash (bcrypt), nunca em texto simples
- Autenticação por token (JWT) enviado no header `Authorization: Bearer <token>`
- Dois perfis (roles): `cliente` e `admin`
- Middleware de proteção de rotas (só autenticados) e de autorização (só admin)
- Consultar e alterar dados pessoais
- Alterar password

### Animais
- Cliente pode adicionar um ou mais animais à sua conta
- Campos: nome, fotografia, espécie, raça, data de nascimento, sexo, peso, informações relevantes, necessidades especiais
- Consultar, editar e remover os seus animais
- Um cliente só consegue ver/editar os **seus** animais (verificação de propriedade)
- Upload de fotografia (validação de tipo e tamanho)

### Serviços
- CRUD completo (admin): criar, editar, remover, consultar
- Campos: nome, descrição, preço, duração (opcional), imagem, categoria, ativo/inativo
- Listagem pública com filtro por categoria
- Os serviços do website vêm sempre da base de dados (nada hardcoded)

### Marcações
- Cliente cria marcação escolhendo: animal, serviço, data, hora/período
- Estados: `Pendente`, `Confirmada`, `Concluída`, `Cancelada`
- Estado inicial: `Pendente`
- Cliente consulta as suas marcações e os detalhes de cada uma
- Cliente cancela marcação (apenas se Pendente/Confirmada e com a antecedência definida)
- Admin altera o estado da marcação
- Validações: data não pode ser no passado, animal tem de pertencer ao cliente, serviço tem de estar ativo, sem marcações duplicadas no mesmo horário
- Alojamento: data de entrada e data de saída (saída posterior à entrada)

### Área de gestão (admin)
- Serviços: criar, editar, remover, consultar
- Clientes: listar, pesquisar por nome/email, ver detalhes
- Animais: listar, pesquisar, ver o respetivo proprietário
- Marcações: listar, filtrar por estado e por data, ver detalhes, alterar estado
- (Opcional) Dashboard com contagens: marcações pendentes, clientes, animais

### Pesquisa e filtros
- Serviços por categoria
- Marcações por estado e por data
- Clientes por nome/email
- Animais por nome/espécie/proprietário
- Filtros feitos no servidor via query params (ex: `?estado=Pendente&data=2026-11-10`)

### Validações e erros
- Validação de todos os inputs no servidor (ex: Joi, Zod ou express-validator)
- Email válido e único, password com mínimo de 8 caracteres
- Códigos HTTP corretos (200, 201, 400, 401, 403, 404, 409, 500)
- Respostas de erro em formato consistente:
```json
{ "sucesso": false, "mensagem": "Email já registado", "erros": [] }
```
- Mensagens claras para o utilizador (o Frontend apresenta-as)
- Middleware global de tratamento de erros

---

## Base de dados

### Tabelas

**utilizadores**
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AI | |
| nome | VARCHAR(100) | |
| email | VARCHAR(150) | UNIQUE |
| password_hash | VARCHAR(255) | |
| telemovel | VARCHAR(20) | |
| role | ENUM('cliente','admin') | default 'cliente' |
| criado_em | DATETIME | default now |

**animais**
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AI | |
| utilizador_id | INT FK | → utilizadores.id |
| nome | VARCHAR(100) | |
| fotografia | VARCHAR(255) | caminho/URL |
| especie | VARCHAR(50) | |
| raca | VARCHAR(100) | |
| data_nascimento | DATE | |
| sexo | ENUM('M','F') | |
| peso | DECIMAL(5,2) | kg |
| informacoes | TEXT | |
| necessidades_especiais | TEXT | |

**categorias_servico**
| Campo | Tipo |
|---|---|
| id | INT PK AI |
| nome | VARCHAR(80) |

**servicos**
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AI | |
| categoria_id | INT FK | → categorias_servico.id |
| nome | VARCHAR(100) | |
| descricao | TEXT | |
| preco | DECIMAL(8,2) | |
| duracao_minutos | INT NULL | não se aplica a alojamento |
| imagem | VARCHAR(255) | |
| ativo | BOOLEAN | default true |

**estados_marcacao**
| Campo | Tipo |
|---|---|
| id | INT PK AI |
| nome | VARCHAR(30) |

Valores: Pendente, Confirmada, Concluída, Cancelada

**marcacoes**
| Campo | Tipo | Notas |
|---|---|---|
| id | INT PK AI | |
| utilizador_id | INT FK | → utilizadores.id |
| animal_id | INT FK | → animais.id |
| servico_id | INT FK | → servicos.id |
| estado_id | INT FK | → estados_marcacao.id |
| data | DATE | |
| hora | TIME NULL | ou período (manhã/tarde) |
| data_fim | DATE NULL | só alojamento |
| observacoes | TEXT | |
| criado_em | DATETIME | |

### Relações
- Um **utilizador** tem muitos **animais** (1:N)
- Um **utilizador** tem muitas **marcações** (1:N)
- Um **animal** tem muitas **marcações** (1:N)
- Um **serviço** tem muitas **marcações** (1:N)
- Uma **categoria** tem muitos **serviços** (1:N)
- Um **estado** tem muitas **marcações** (1:N)

### Regras de integridade
- Chaves estrangeiras com `ON DELETE` definido (ex: apagar utilizador apaga os seus animais; não permitir apagar serviço com marcações, usar `ativo = false`)
- Índices em `email`, `utilizador_id`, `data` e `estado_id`
- Dados iniciais (seed): estados, categorias, serviços de exemplo e um utilizador admin

---

## API (endpoints)

Base URL: `/api`

### Autenticação
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | /auth/registo | público | Criar conta |
| POST | /auth/login | público | Iniciar sessão (devolve token) |
| GET | /auth/me | cliente | Dados do utilizador autenticado |
| PUT | /auth/me | cliente | Alterar dados pessoais |
| PUT | /auth/password | cliente | Alterar password |

### Serviços
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | /servicos | público | Listar (filtro `?categoria=`) |
| GET | /servicos/:id | público | Detalhe |
| POST | /servicos | admin | Criar |
| PUT | /servicos/:id | admin | Editar |
| DELETE | /servicos/:id | admin | Remover |
| GET | /categorias | público | Listar categorias |

### Animais
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | /animais | cliente | Listar os meus animais |
| GET | /animais/:id | cliente | Detalhe |
| POST | /animais | cliente | Adicionar |
| PUT | /animais/:id | cliente | Editar |
| DELETE | /animais/:id | cliente | Remover |

### Marcações
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | /marcacoes | cliente | Listar as minhas marcações |
| GET | /marcacoes/:id | cliente | Detalhe |
| POST | /marcacoes | cliente | Criar marcação |
| PATCH | /marcacoes/:id/cancelar | cliente | Cancelar |

### Gestão (admin)
| Método | Rota | Descrição |
|---|---|---|
| GET | /admin/clientes?pesquisa= | Listar/pesquisar clientes |
| GET | /admin/clientes/:id | Detalhe do cliente |
| GET | /admin/animais?pesquisa= | Listar/pesquisar animais (com proprietário) |
| GET | /admin/marcacoes?estado=&data= | Listar/filtrar marcações |
| GET | /admin/marcacoes/:id | Detalhe da marcação |
| PATCH | /admin/marcacoes/:id/estado | Alterar estado |

---

## API keys e variáveis de ambiente

Todas as chaves, segredos e credenciais ficam num ficheiro **`.env`**, que **nunca** vai para o repositório.

### Ficheiro `.env` (exemplo)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=a_tua_password
DB_NAME=hotel_animais

# Autenticação
JWT_SECRET=uma_chave_longa_e_aleatoria_de_pelo_menos_32_caracteres
JWT_EXPIRES_IN=1d

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173

# Uploads
UPLOAD_MAX_SIZE_MB=5
```

### Regras
- Adicionar `.env` ao **`.gitignore`** logo no início do projeto
- Criar um **`.env.example`** com os mesmos nomes mas **sem valores reais**, e este sim vai para o repositório, para os colegas saberem o que configurar
- O `JWT_SECRET` deve ser longo e aleatório. Gerar com:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Cada elemento da equipa usa o seu próprio `.env` local; os segredos partilham-se em privado (nunca no GitHub, Discord público ou prints)
- Se uma chave for exposta por engano, deve ser **trocada de imediato**
- Nunca escrever credenciais diretamente no código
- Ler sempre via `process.env.NOME_DA_VARIAVEL`

### Serviços externos
O enunciado não exige integrações externas, por isso **não são necessárias API keys de terceiros** para o projeto base. Caso a equipa avance com extensões, as chaves seguem as mesmas regras acima:
- Armazenamento de imagens (ex: Cloudinary): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Envio de emails (ex: Resend, SendGrid): `EMAIL_API_KEY`
- Mapas no website (ex: Google Maps): `MAPS_API_KEY` (esta é usada no Frontend, por isso deve ter restrição por domínio)

---

## Segurança
- Hash de passwords com bcrypt (salt rounds ≥ 10)
- Queries parametrizadas / ORM (proteção contra SQL Injection)
- CORS restrito ao URL do Frontend
- Validação e sanitização de todos os inputs
- Verificação de propriedade (um cliente nunca acede a dados de outro)
- Verificação de role em todas as rotas de admin
- Upload: limitar tipos (jpg, png, webp) e tamanho
- Não devolver nunca `password_hash` nas respostas
- Mensagens de login genéricas ("Credenciais inválidas"), sem indicar se foi o email ou a password que falhou

---

## Estrutura de pastas
```
backend/
├── src/
│   ├── config/          # ligação à BD, variáveis de ambiente
│   ├── models/          # modelos / acesso a dados
│   ├── controllers/     # lógica de cada rota
│   ├── routes/          # definição dos endpoints
│   ├── middlewares/     # auth, roles, validação, erros, upload
│   ├── validators/      # schemas de validação
│   ├── utils/           # funções auxiliares
│   └── app.js
├── database/
│   ├── schema.sql       # criação das tabelas
│   └── seed.sql         # dados iniciais
├── uploads/             # imagens enviadas
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Integração com o Frontend
- Documentar todos os endpoints (método, rota, body, resposta, erros) e partilhar com o Frontend, por exemplo via Postman Collection ou Swagger
- Formato de resposta único e consistente
- Combinar com o Frontend: nomes dos campos, formato das datas (`YYYY-MM-DD`), estrutura dos erros
- Disponibilizar cedo dados de teste (seed) para o Frontend poder trabalhar

---

## Plano por fases

**Fase 1** — Modelação da BD (diagrama ER), `schema.sql`, setup do projeto, `.env`, ligação à BD

**Fase 2** — Autenticação (registo/login/JWT), CRUD de serviços, CRUD de animais

**Fase 3** — Marcações (criação, estados, cancelamento), área de gestão

**Fase 4** — Integração com Frontend, testes (Postman), correção de bugs, documentação, seed final

---

## Testes
- Testar todos os endpoints em Postman/Insomnia
- Testar casos de erro: dados inválidos, token inválido/expirado, acesso a recursos de outro utilizador, acesso de cliente a rotas de admin
- Testar a regra de cancelamento e de marcações duplicadas

---

## Extensões (se sobrar tempo)
- Notificação por email ao mudar o estado da marcação
- Limite de lotação por dia no alojamento
- Dashboard com estatísticas
- Recuperação de password
- Paginação nas listagens