### Core Information:

* **Main language:** TypeScript (JavaScript)
* **Framework (choose one):** NextJS, RemixJS
* **Validation library (choose one):** Zod, Joi, Yup
* **ORM (choose one):** Prisma, Mongoose, Sequelize, Drizzle ORM
* **Database (choose one):** PostgreSQL, MongoDB, MySQL, MariaDB, SQLite
* **Authentication method (choose one):** Session, JWT, OAuth 2.0
* **UI library (choose one):** Material UI, Joy UI, Tailwind CSS, React Bootstrap, AntD, Core UI, Chakra UI
* **API Protocol (choose one):** GraphQL, REST, tRPC
* **Code quality tools:** ESLint, Prettier
* **Package manager (choose one):** NPM, Yarn, PNPM
* **Module bundler (choose one):** Webpack, Vite
* **Environment (optional):** Docker Compose, Kubernetes
* **Documentation:** Readme.md
* **Version control system:** GitHub or GitLab

---

### Project Description:

Розробити **Form Builder** систему.

#### Адмін-панель (приватна зона, захищена авторизацією):

1. **CRUD для форм**

    * Можливість створювати, редагувати та видаляти форми.
    * Кожна форма складається з полів наступних типів:

        * **text** – однострочне текстове поле
            * опції: `label`, `placeholder`, `required`, `minLength`, `maxLength`
        * **number** – числове однострочне поле

            * опції: `label`, `placeholder`, `required`, `min`, `max`, `step`
        * **textarea** – багатоcтрочне текстове поле

            * опції: `label`, `placeholder`, `required`, `minLength`, `maxLength`, `rows`

2. **Редактор форм**

    * Екран створення/редагування повинен мати прев’ю форми.
    * Клік по полю відкриває сайдбар із його налаштуваннями.

3. **Збереження в БД**

    * Структура форми зберігається у вибраній БД через ORM.

#### Публічна частина:

1. **Головна сторінка**

    * Відображає список доступних форм.

2. **Заповнення форми**

    * Користувач може відкрити опубліковану форму та заповнити її.
    * Після сабміту показується модальне вікно з введеними даними для підтвердження.

#### Додатково (бонусне завдання):

* Інтегрувати **AI-агента** (наприклад, LangChain.js / OpenAI), який допоможе створювати або редагувати поля у форматі чату.
  (Приклад: користувач пише “Додай поле для телефону, обов’язкове” → агент генерує потрібне поле).
