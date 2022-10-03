import { getBudgetAsPercentage, getBudget } from "../budgetCalculator";
import { PriceFinder } from "../getBestPrices";
import { splitIntoChunk } from "../html-generator";
import { CategoriesService } from "./categories.service";
import { FinancesService } from "./finances.service";

import { ProductsService } from "./wishlist.service";
import { ProductEnrichmentService } from "./productEnrichment.service";
import { PriceHistoryService } from "./priceHistory.service";
import { GroceriesService } from "./groceries.service";
import { SupermarketCategoriesService } from "./supermarketCategories.service";
import { config } from "../config";
import { FileService } from "./files.service";

export class BotService {
  finances = {};
  productEnrichmentService: ProductEnrichmentService;

  commands = [
    ["/mywishlist"],
    ["/setincome"],
    ["/mybudget"],

    ["/addwishlist {item}"],
    ["/removewishlist {item}"],
    ["/emptywishlist"],
    ["/wishlistoffers"],
  ];

  constructor(
    private bot,
    private productService: ProductsService,
    private categoryService: CategoriesService,
    private financesService: FinancesService,
    private priceFinder: PriceFinder,
    private priceHistoryService: PriceHistoryService,
    private groceriesService: GroceriesService,
    private supermarketCategoriesService: SupermarketCategoriesService,
    private fileService: FileService
  ) {
    this.bot.nextMessage = {};
    this.bot.onNextMessage = (chatId, callback) => {
      const promise = new Promise((resolve) => {
        this.bot.nextMessage[chatId] = { callback: callback, next: resolve };
      });
      return promise;
    };
    this.productEnrichmentService = new ProductEnrichmentService(
      priceFinder,
      productService,
      groceriesService,
      priceHistoryService
    );
  }

  async beforeEach(chatId) {
    const finances = await (
      await this.financesService.find({ chatId: chatId })
    ).at(0);
    console.log(finances);
    this.finances = {};
    Object.assign(this.finances, { [chatId]: finances || {} });
  }

  start = async (msg, match) => {
    const [chatId] = [msg.chat.id];

    this.bot.sendMessage(
      chatId,
      "Bem vindo! Vou te ajudar a conquistar todos os seus sonhos materiais com responsabilidade."
    );
    this.bot
      .sendMessage(chatId, "Para começar, insira a sua renda mensal.")
      .then(() => {
        return this.bot.onNextMessage(chatId, async (msg) => {
          this.finances[chatId] = {};

          Object.assign(this.finances[chatId], {
            chatId: chatId,
          });

          Object.assign(this.finances[chatId], {
            income: parseFloat(msg.text) || 0,
          });

          this.sendSetIncomeReply(chatId);

          await this.bot.sendMessage(
            chatId,
            "Vamos configurar as tuas despesas?"
          );
          const finances = await (
            await this.financesService.find({ chatId: chatId })
          ).at(0);
          console.log(finances);
          if (finances)
            Object.assign(this.finances, { [chatId]: finances || {} });
          this.bot
            .sendMessage(chatId, "Insira o seu gasto com aluguel")
            .then(() => {
              return this.bot.onNextMessage(chatId, async (msg) => {
                Object.assign(this.finances[chatId], {
                  rent: parseFloat(msg.text) || 0,
                });

                await this.bot.sendMessage(
                  chatId,
                  "Despesa com aluguel setada para " +
                  this.finances[chatId]["rent"]
                );
                this.bot
                  .sendMessage(
                    chatId,
                    "Agora, insira o gasto com investimentos"
                  )
                  .then(() => {
                    return this.bot.onNextMessage(chatId, async (msg) => {
                      Object.assign(this.finances[chatId], {
                        investments: parseFloat(msg.text) || 0,
                      });
                      await this.bot.sendMessage(
                        chatId,
                        "Investimento setado para " +
                        this.finances[chatId]["investments"]
                      );

                      this.bot
                        .sendMessage(chatId, "Seu gasto com supermercado: ")
                        .then(() => {
                          return this.bot.onNextMessage(chatId, async (msg) => {
                            Object.assign(this.finances[chatId], {
                              groceries: parseFloat(msg.text) || 0,
                            });
                            await this.bot.sendMessage(
                              chatId,
                              "Supermercado setado para " +
                              this.finances[chatId]["groceries"]
                            );
                            this.bot
                              .sendMessage(chatId, "Seu gasto com contas: ")
                              .then(() => {
                                return this.bot.onNextMessage(
                                  chatId,
                                  async (msg) => {
                                    Object.assign(this.finances[chatId], {
                                      bills: parseFloat(msg.text) || 0,
                                    });
                                    await this.bot.sendMessage(
                                      chatId,
                                      "Contas setado para " +
                                      this.finances[chatId]["bills"]
                                    );
                                    this.bot
                                      .sendMessage(
                                        chatId,
                                        "Seu gasto com serviços por assinatura: "
                                      )
                                      .then(() => {
                                        return this.bot.onNextMessage(
                                          chatId,
                                          async (msg) => {
                                            Object.assign(
                                              this.finances[chatId],
                                              {
                                                subscriptions:
                                                  parseFloat(msg.text) || 0,
                                              }
                                            );
                                            await this.bot.sendMessage(
                                              chatId,
                                              "Assinaturas setado para " +
                                              this.finances[chatId][
                                              "subscriptions"
                                              ]
                                            );
                                            this.bot
                                              .sendMessage(
                                                chatId,
                                                "Seu gasto com impostos: "
                                              )
                                              .then(async () => {
                                                return this.bot.onNextMessage(
                                                  chatId,
                                                  async (msg) => {
                                                    Object.assign(
                                                      this.finances[chatId],
                                                      {
                                                        taxes:
                                                          parseFloat(
                                                            msg.text
                                                          ) || 0,
                                                      }
                                                    );
                                                    await this.bot.sendMessage(
                                                      chatId,
                                                      "Impostos setado para " +
                                                      this.finances[chatId][
                                                      "taxes"
                                                      ]
                                                    );

                                                    this.bot.sendMessage(
                                                      chatId,
                                                      "Estamos prontos! Segue uma analise do seu orçamento:"
                                                    );

                                                    const budget = getBudget(
                                                      this.finances[chatId][
                                                      "income"
                                                      ],
                                                      this.finances[chatId]
                                                    );
                                                    const budgetPercentage =
                                                      getBudgetAsPercentage(
                                                        this.finances[chatId][
                                                        "income"
                                                        ],
                                                        this.finances[chatId]
                                                      );
                                                    await this.bot.sendMessage(
                                                      chatId,
                                                      "Seu valor disponível para torrar é : R$" +
                                                      JSON.stringify(budget)
                                                    );
                                                    Object.assign(
                                                      this.finances[chatId],
                                                      {
                                                        available: budget,
                                                      }
                                                    );
                                                    await this.financesService.update(
                                                      { chatId: chatId },
                                                      this.finances[chatId]
                                                    );
                                                    await this.bot.sendMessage(
                                                      chatId,
                                                      "Despesas salvas."
                                                    );
                                                    await this.bot.sendMessage(
                                                      chatId,
                                                      this.parseBudgetPercentage(
                                                        budgetPercentage
                                                      ),
                                                      {
                                                        parse_mode: "HTML",
                                                      }
                                                    );
                                                    await this.bot.sendMessage(
                                                      chatId,
                                                      "Pronto para utilizar os comandos:",
                                                      {
                                                        reply_markup: {
                                                          keyboard: this.commands,
                                                        },
                                                      }
                                                    );
                                                  }
                                                );
                                              });
                                          }
                                        );
                                      });
                                  }
                                );
                              });
                          });
                        });
                    });
                  });
              });
            });
        });
      });
  };

  private parseBudgetPercentage(budgetPercentage) {
    return (
      "Seu orçamento em porcentagem: " +
      `
      <b>Aluguel: </b><i>${budgetPercentage.rent}</i>
      <b>Investimentos: </b><i>${budgetPercentage.investments}</i>
      <b>Supermercado: </b><i>${budgetPercentage.groceries}</i>
      <b>Contas: </b><i>${budgetPercentage.bills}</i>
      <b>Assinaturas: </b><i>${budgetPercentage.subscriptions}</i>
      <b>Impostos: </b><i>${budgetPercentage.taxes}</i>
      <b>Disponível: </b><i>${budgetPercentage.budget}</i>
      `
    );
  }

  setincome = async (msg, match) => {
    const chatId = msg.chat.id;
    const income = match.input.replace("/setincome", "");

    await this.beforeEach(chatId);

    if (income === "") {
      this.bot
        .sendMessage(chatId, "Por favor, passe um valor para renda")
        .then(() => {
          return this.bot.onNextMessage(chatId, async (msg) => {
            this.finances[chatId]["income"] = parseFloat(msg.text) || 0;

            this.sendSetIncomeReply(chatId);
            this.trySetBudget(chatId);
          });
        });
      return;
    }
    this.finances[chatId]["income"] = parseFloat(income) || 0;

    this.sendSetIncomeReply(chatId);

    this.trySetBudget(chatId);
  };

  private sendSetIncomeReply(chatId) {
    this.bot.sendMessage(
      chatId,
      "Renda setada para " + this.finances[chatId]["income"]
    );
  }

  private async trySetBudget(chatId) {
    const budget = getBudget(
      this.finances[chatId]["income"],
      this.finances[chatId]
    );
    try {
      Object.assign(this.finances[chatId], {
        available: budget,
      });
      await this.financesService.update(
        { chatId: chatId },
        this.finances[chatId]
      );
      await this.bot.sendMessage(
        chatId,
        "Despesas salvas. Novo valor disponível: R$" + budget
      );
    } catch (ex) {
      console.error(ex, "failed to save new income and update finances");
    }
  }

  mybudget = async (msg, match) => {
    const [chatId, idx] = this.parseChat(msg, match);
    try {
      await this.beforeEach(chatId);

      console.log(this.finances[chatId]["income"]);
    } catch (ex) { }
    if (!this.finances[chatId]["income"]) {
      this.bot.sendMessage(
        chatId,
        "Primeiro defina a sua renda com /setincome"
      );
      return;
    }

    const budget = getBudget(
      this.finances[chatId]["income"],
      this.finances[chatId]
    );
    const budgetPercentage = getBudgetAsPercentage(
      this.finances[chatId]["income"]
    );

    this.bot.sendMessage(
      chatId,
      "Valor disponivel para gastar : <b>R$" + JSON.stringify(budget) + "</b>",
      {
        parse_mode: "HTML",
      }
    );
    this.bot.sendMessage(chatId, "Despesas previstas: R$" + await this.allPredictedExpenses(chatId));
    this.bot.sendMessage(chatId, this.parseBudgetPercentage(budgetPercentage), {
      parse_mode: "HTML",
    });
  };

  enrich = async (msg, match) => {
    const [chatId, idx] = this.parseChat(msg, match);

    const products = await this.productService.getWishlist(chatId);
    const offers = await this.priceFinder.getPricesArray(
      products.map((prd) => prd.name)
    );

    this.bot.sendMessage(chatId, JSON.stringify(offers, undefined, 4));
  };

  enrichitem = async (msg, match) => {
    const [chatId, idx] = this.parseChat(msg, match);

    if (idx === undefined) {
      this.bot.sendMessage(chatId, "Passe o id de um item da lista");
      return;
    }

    const products = await this.productService.getWishlistItemById(idx);
    const offers = await this.priceFinder.getPricesArray(
      products.map((prd) => prd.name)
    );

    this.bot.sendMessage(chatId, JSON.stringify(offers, undefined, 4));
  };

  addwishlist = async (msg, match) => {
    const chatId = msg.chat.id;
    let productName = match.input.replace("/addwishlist", "").trim();
    if (productName === "") {
      this.bot.sendMessage(
        chatId,
        "Por favor, forneca o nome de um produto. Ex: /addwishlist caderno do zachbell"
      )
        .then(() => {
          return this.bot.onNextMessage(chatId, async (msg) => {
            productName = msg.text;
            await this.productService.addTowishlist(productName, chatId);
            await this.setProductCategory(chatId, productName);
          })
        })
      return
    }

    await this.productService.addTowishlist(productName, chatId);
    await this.setProductCategory(chatId, productName);
  };

  private async setProductCategory(chatId, productName) {
    const categories = await this.categoryService.list();

    this.bot
      .sendMessage(chatId, "Defina uma categoria para o produto:", {
        reply_markup: JSON.stringify({
          force_reply: true,
          keyboard: splitIntoChunk(
            categories.map((cat) => {
              return cat.name;
            }),
            1
          ),
          resize_keyboard: true,
          one_time_keyboard: true,
        }),
      })
      .then(() => {
        return this.bot.onNextMessage(chatId, async (msg) => {
          await this.addProductToCategory(productName, msg.text.trim());

          await this.bot.sendMessage(
            chatId,
            `Produto foi rotulado com a categoria "${msg.text}"`,
            {
              reply_markup: {
                keyboard: this.commands,
              },
            }
          );

          const product = await this.productService.getWishlistByName(
            productName
          );

          await this.bot.sendMessage(
            chatId,
            `Obtendo melhores ofertas para o produto "${productName.trim()}" ....`,
            {
              reply_markup: {
                keyboard: this.commands,
              },
            }
          );

          await this.productEnrichmentService.enrich(product as any, chatId);

          const [path] = await this.getWishlistScreenshot(chatId);

          await this.bot.sendPhoto(chatId, path, {
            caption:
              "Aqui está a sua lista. Essa imagem ficará disponível por 1 dia. Para ver a sua lista digite '/mywishlist' ou '/wishlistoffers' para ver as ofertas relacionadas a sua lista de desejos.",
          });
          this.bot.sendMessage(
            msg.chat.id,
            `<a href="${config.fileServerUrl}/${chatId}">Veja a lista no browser</a>`,
            {
              parse_mode: "HTML",
              reply_markup: {
                remove_keyboard: true,
              },
            }
          );

          const totalGroceryExpense = await this.productService.totalCostbyChatId(chatId); 
          await this.bot.sendMessage(chatId, 'Valor total com produtos: '+ totalGroceryExpense);
        });
      });
  }

  addgrocery = async (msg, match) => {
    const chatId = msg.chat.id;
    let productName = match.input.replace("/addgrocery", "").trim();
    if (productName === "") {
      this.bot.sendMessage(
        chatId,
        "Por favor, forneca o nome de um produto. Ex: /addgrocery Iogurte grego 100ml"
      )
        .then(() => {
          return this.bot.onNextMessage(chatId, async (msg) => {
            productName = msg.text;
            await this.groceriesService.addTolist(productName, chatId);
            await this.setGroceryBrand(chatId, productName);
          })
        })
      return
    }

    await this.groceriesService.addTolist(productName, chatId);
    await this.setGroceryBrand(chatId, productName);
  };

  private async setGroceryBrand(chatId, productName) {
    const categories = await this.supermarketCategoriesService.list();

    this.bot
      .sendMessage(chatId, "Defina uma marca (opcional) para o produto (ex. 3 corações, itambé):", {
        reply_markup: JSON.stringify({
          force_reply: true,
        }),
      })
      .then(() => {
        return this.bot.onNextMessage(chatId, async (msg) => {
          const brand = msg.text;
          await this.bot.sendMessage(chatId, "Marca: "+msg.text);
          await this.groceriesService.addToBrand(productName, brand);
          await this.bot.sendMessage(
            chatId,
            `Produto foi rotulado com a marca "${msg.text.trim()}"`,
            {
              reply_markup: {
                keyboard: this.commands,
              },
            }
          );
          this.bot
            .sendMessage(chatId, "Defina uma categoria para o produto:", {
              reply_markup: JSON.stringify({
                force_reply: true,
                keyboard: splitIntoChunk(
                  categories.map((cat) => {
                    return cat.name;
                  }),
                  1
                ),
                resize_keyboard: true,
                one_time_keyboard: true,
              }),
            })
            .then(() => {
              return this.bot.onNextMessage(chatId, async (msg) => {

                await this.addGroceryToCategory(productName, msg.text.trim());

                await this.bot.sendMessage(
                  chatId,
                  `Produto foi rotulado com a categoria "${msg.text}"`,
                  {
                    reply_markup: {
                      keyboard: this.commands,
                    },
                  }
                );

                const product = await this.groceriesService.getByName(
                  productName
                );

                await this.bot.sendMessage(
                  chatId,
                  `Obtendo melhores ofertas para o produto "${productName.trim()}" ....`,
                  {
                    reply_markup: {
                      keyboard: this.commands,
                    },
                  }
                );

                await this.productEnrichmentService.enrichGrocery(product as any, chatId);

                const [path] = await this.getGroceriesScreenshot(chatId);

                await this.bot.sendPhoto(chatId, path, {
                  caption:
                    "Aqui está a sua lista. Essa imagem ficará disponível por 1 dia. Para ver a sua lista digite '/mygroceries' ou '/groceryoffers' para ver as ofertas relacionadas a sua lista de desejos.",
                });
                this.bot.sendMessage(
                  msg.chat.id,
                  `<a href="${config.fileServerUrl}/groceries/${chatId}">Veja a lista no browser</a>`,
                  {
                    parse_mode: "HTML",
                    reply_markup: {
                      remove_keyboard: true,
                    },
                  }
                );
                const totalGroceryExpense = await this.groceriesService.totalCostbyChatId(chatId); 
                await this.bot.sendMessage(chatId, 'Valor total com mercado: '+ totalGroceryExpense);
              });

            });
        })
      })
  }

  mygroceries = async (msg, match) => {
    const [chatId] = this.parseChat(msg, match);
    const [path] = await this.getGroceriesScreenshot(chatId);
    this.bot.sendPhoto(chatId, path, {
      caption:
        "Aqui está a sua lista. '/groceryoffers' Para ver as ofertas relacionadas a sua lista de desejos.",
    });
    this.bot.sendMessage(
      msg.chat.id,
      `<a href="${path}">Veja a lista no browser</a>`,
      { parse_mode: "HTML" }
    );
  };

  mywishlist = async (msg, match) => {
    const [chatId] = this.parseChat(msg, match);
    const [path] = await this.getWishlistScreenshot(chatId);
    this.bot.sendPhoto(chatId, path, {
      caption:
        "Aqui está a sua lista. '/wishlistoffers' Para ver as ofertas relacionadas a sua lista de desejos.",
    });
    this.bot.sendMessage(
      msg.chat.id,
      `<a href="${path}">Veja a lista no browser</a>`,
      { parse_mode: "HTML" }
    );
  };

  removewishlist = async (msg, match) => {
    const [chatId, id] = this.parseChat(msg, match);

    if (!id) {
      this.bot.sendMessage(
        chatId,
        "Esse comando precisa de um argumento. Ex: /wishlist {{id}}"
      );
      return;
    }

    await this.productService.removeWishlist(id);
    const [path] = await this.getWishlistScreenshot(chatId);

    this.bot.sendPhoto(chatId, path, { caption: "Aqui está a sua lista !" });
  };

  emptywishlist = async (msg, match) => {
    const [chatId, resp] = this.parseChat(msg, match);
    await this.productService.emptyCollection();
    this.bot.sendMessage(chatId, "Lista apagada com sucesso.");
  };

  emptygroceries = async (msg, match) => {
    const [chatId, resp] = this.parseChat(msg, match);
    await this.groceriesService.emptyCollection();
    this.bot.sendMessage(chatId, "Lista apagada com sucesso.");
  };

  wishlistoffers = async (msg, match) => {
    const [chatId, resp] = this.parseChat(msg, match);
    const products = await this.productService.list();
    const result = await this.fileService.uploadOffersTableScreenshot(products, chatId);

    await this.bot.sendPhoto(msg.chat.id, result, {
      caption: `<a href="${config.fileServerUrl}/${chatId}">Veja a lista no browser</a>`,
      parse_mode: "HTML"
    });
    this.bot.sendMessage(chatId, "Total: R$" + await this.getProductExpenses(chatId))

  };

  groceryoffers = async (msg, match) => {
    const [chatId, resp] = this.parseChat(msg, match);
    const products = await this.groceriesService.list();
    const result = await this.fileService.uploadGroceriesTableScreenshot(products, chatId);

    await this.bot.sendPhoto(msg.chat.id, result, {
      caption: `<a href="${config.fileServerUrl}/${chatId}/groceries">Veja a lista no browser</a>`,
      parse_mode: "HTML"
    });
    this.bot.sendMessage(chatId, "Total: R$" + await this.getGroceryExpenses(chatId))
  };

  futureexpenses = async (msg, match) => {
    const [chatId, resp] = this.parseChat(msg, match);
    await this.bot.sendMessage(chatId, 'Valor total com produtos: '+ await this.getGroceryExpenses(chatId));

    const totalGroceryExpense = await this.getProductExpenses(chatId); 
    await this.bot.sendMessage(chatId, 'Valor total com mercado: '+ totalGroceryExpense);
  }

  private async getGroceryExpenses(chatId){
    return this.groceriesService.totalCostbyChatId(chatId); 
  }

  private async getProductExpenses(chatId){
    return this.productService.totalCostbyChatId(chatId);
  } 

  private async allPredictedExpenses(chatId){
    const totalExpense = await this.productService.totalCostbyChatId(chatId); 
    const totalGroceryExpense = await this.groceriesService.totalCostbyChatId(chatId); 
    return totalExpense + totalGroceryExpense;
  }

  async addGroceryToCategory(product, category) {
    return this.groceriesService.addToCategory(product, category);
  }

  async addProductToCategory(product, category) {
    return this.productService.addToCategory(product, category);
  }

  private parseChat(msg, match) {
    return [msg.chat.id, match[1]];
  }

  private async getGroceriesScreenshot(chatId) {
    const products = await this.groceriesService.findByChatId(chatId);
    const path = await this.fileService.uploadGroceriesTableScreenshot(products, chatId);
    return [path, products];
  }
  private async getWishlistScreenshot(chatId) {
    const products = await this.productService.getWishlist(chatId);
    const path = await this.fileService.uploadWishlistTableScreenshot(products, chatId);
    return [path, products];
  }
}
