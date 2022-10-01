require('dotenv').config();
import { Db, MongoClient } from 'mongodb';
import * as TelegramBot from 'node-telegram-bot-api';

import { init } from './bot';
import { dbconnection } from './database';
import { PriceFinder } from './getBestPrices';
import { OfferSearchScheduler } from './routines/offerSearchScheduler';
import { PurgeStaticFilesScheduler } from './routines/purgeStaticFiles';
import { BotService } from './services/bot.service';
import { CategoriesService } from './services/categories.service';
import { ChatIdService } from './services/chatId.service';
import { FinancesService } from './services/finances.service';
import { ProductsService } from './services/wishlist.service';

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

export async function initBot() {
  dbconnection().then(([db, connection]) => {
    const productService = new ProductsService(db as unknown as Db);
    const categoryService = new CategoriesService(db as unknown as Db);
    const expenseService = new FinancesService(db as unknown as Db);
    const chatIdService = new ChatIdService(db as unknown as Db);
    const priceFinder = new PriceFinder(db as unknown as Db);
    const botService = new BotService(
      bot,
      productService,
      categoryService,
      expenseService,
      priceFinder,
    );
    init(bot, botService, chatIdService);

    new OfferSearchScheduler(db as unknown as Db, bot).start();
    new PurgeStaticFilesScheduler(db as unknown as Db).start();

    // When the mongodb server goes down, the driver emits a 'close' event
    (connection as MongoClient).on('close', () => {
      console.log('-> lost connection');
    });
    // The driver tries to automatically reconnect by default, so when the
    // server starts the driver will reconnect and emit a 'reconnect' event.
    (connection as MongoClient).on('reconnect', () => {
      console.log('-> reconnected');
    });
  });
}
