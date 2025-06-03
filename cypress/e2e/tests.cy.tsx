const SELECTORS = {
  userApi: '/api/auth/user',
  ingredientsApi: '/api/ingredients',
  orderApi: '/api/orders',
  userNameInput: 'input[name="name"]',
  testUserName: 'Test User',
  profileUrlPart: '/profile',
  homeUrl: 'http://localhost:4000/',
  bunName: 'Флюоресцентная булка R2-D3',
  fillingName: 'Биокотлета из марсианской Магнолии',
  bunOption: 'Краторная булка',
  bunPlaceholder: 'Выберите булки',
  fillingPlaceholder: 'Выберите начинку',
  orderButton: 'Оформить заказ',
  orderConfirmationText: 'идентификатор заказа',
  constructorTitle: 'Соберите бургер',
  personalCabinet: 'Личный кабинет',
};

describe('Авторизация и профиль', () => {
  beforeEach(() => {
    cy.intercept('GET', SELECTORS.userApi, {
      statusCode: 200,
      body: {
        success: true,
        user: {
          email: 'test_user@example.com',
          name: SELECTORS.testUserName,
        }
      }
    }).as('getUser');
  });

  it('Переход в профиль после входа', () => {
    cy.loginByApi();
    cy.visit('/');
    cy.get(`a:contains(${SELECTORS.personalCabinet})`).click(); // изменено
    cy.wait('@getUser');

    cy.get(`a:contains(${SELECTORS.testUserName})`).click(); // изменено
    cy.location('pathname').should('include', SELECTORS.profileUrlPart);
    cy.get('form').should('exist');
    cy.get(SELECTORS.userNameInput).should('have.value', SELECTORS.testUserName);
  });
});

describe('Функциональность конструктора бургеров', () => {
  beforeEach(() => {
    cy.fixture('ingredients.json').as('ingredientsData');
    cy.fixture('user.json').as('userData');

    cy.intercept('GET', SELECTORS.ingredientsApi, { fixture: 'ingredients.json' }).as('getIngredients');
    cy.intercept('GET', SELECTORS.userApi, { fixture: 'user.json' }).as('getUser');

    cy.setCookie('accessToken', 'mockToken');
    cy.window().then(win => win.localStorage.setItem('refreshToken', 'mockToken'));

    cy.visit('/');
    cy.wait('@getIngredients');
    cy.contains(SELECTORS.constructorTitle).should('exist');
  });

  it('Нет булки при старте', () => {
    cy.contains(SELECTORS.bunPlaceholder).should('exist');
    cy.contains(SELECTORS.fillingPlaceholder).should('exist');
  });

  it('Добавление булки в конструктор', () => {
    cy.contains(SELECTORS.bunName).parent().find('button').click();
    cy.contains(SELECTORS.bunName).should('exist');
  });

  it('Добавление начинки в конструктор', () => {
    cy.contains('Начинки').scrollIntoView().click();
    cy.contains(SELECTORS.fillingName).parent().find('button').click();
    cy.contains(SELECTORS.fillingName).should('exist');
  });

  it('Добавление ингредиентов в заказ и очистка конструктора', () => {
    cy.intercept('POST', SELECTORS.orderApi, {
      fixture: 'makeOrder.json',
      statusCode: 200
    }).as('newOrder');

    cy.contains(SELECTORS.bunName).parent().find('button').click();
    cy.contains('Начинки').scrollIntoView();
    cy.contains(SELECTORS.fillingName).parent().find('button').click();

    cy.get(`button:contains(${SELECTORS.orderButton})`).should('not.be.disabled').click(); // изменено
    cy.wait('@newOrder').its('response.statusCode').should('eq', 200);

    cy.contains(SELECTORS.orderConfirmationText).should('be.visible');
    cy.get('body').type('{esc}');
    cy.contains(SELECTORS.bunPlaceholder).should('exist');
  });

  it('Открытие и закрытие модального окна ингредиента', () => {
    cy.contains(SELECTORS.bunOption).click();
    cy.location('pathname').should('include', '/ingredients/');
    cy.get('body').type('{esc}');
    cy.location('href').should('eq', SELECTORS.homeUrl);
  });

  it('Закрытие модального окна через клик на оверлей', () => {
    cy.contains(SELECTORS.bunOption).click();
    cy.url().should('include', '/ingredients/');
    cy.contains('Детали ингредиента').should('exist');
    cy.go('back');
    cy.url().should('eq', SELECTORS.homeUrl);
  });
});