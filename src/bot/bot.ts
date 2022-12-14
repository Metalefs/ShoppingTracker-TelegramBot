require("dotenv").config();

// Create a bot that uses 'polling' to fetch new updates
import { BotService } from "./services/bot.service";
import { ChatIdService } from "./services/chatId.service";

export const init = (bot, botService: BotService, chatIdService:ChatIdService) => {
  bot.onText(/\/start/, botService.start);

  bot.onText(/\/setincome/, botService.setincome);
  bot.onText(/\/addtoincome/, botService.addtoincome);
  bot.onText(/\/removefromincome/, botService.removefromincome);

  bot.onText(/\/mybudget/, botService.mybudget);
  bot.onText(/\/setexpense/, botService.setexpense);
  bot.onText(/\/expectedexpenses/, botService.expectedexpenses);

  bot.onText(/\/addwishlist/, botService.addwishlist);
  bot.onText(/\/mywishlist/, botService.mywishlist);

  bot.onText(/\/addgrocery/, botService.addgrocery);
  bot.onText(/\/mygroceries/, botService.mygroceries);

  bot.onText(/\/removewishlist (.+)/, botService.removewishlist);
  bot.onText(/\/emptywishlist/, botService.emptywishlist);
  
  bot.onText(/\/removegrocery (.+)/, botService.removegrocery);
  bot.onText(/\/emptygroceries/, botService.emptygroceries);

  bot.onText(/\/wishlistoffers/, botService.wishlistoffers);
  bot.onText(/\/groceryoffers/, botService.groceryoffers);

  bot.onText(/\/pricehistory (.+)/, botService.pricehistory);
  bot.onText(/\/editprice (.+)/, botService.editprice);
  bot.onText(/\/editgroceryprice (.+)/, botService.editgroceryprice);

  bot.on('message', async(msg) => {
    const chatId = msg.chat.id;
    await chatIdService.add(msg);
    const nextMsg = bot.nextMessage[chatId];
    if (nextMsg) {
      nextMsg.callback(msg);
      nextMsg.next(msg);
      bot.nextMessage[chatId] = undefined;
    }
  })
};
