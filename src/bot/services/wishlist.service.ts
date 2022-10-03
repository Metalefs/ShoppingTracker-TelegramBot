import { Db } from "mongodb";
import { Offer } from "src/shared/interfaces/offer";
import { BaseService } from "../../shared/models/base.service";

export class ProductsService extends BaseService {
  constructor(protected dbconnection: Db) {
    super(dbconnection, "wishlist");
  }

  addTowishlist = async (product, chatId, offer?) => {
    const count = await this.dbconnection
      .collection("wishlist")
      .countDocuments();
    await this.update(
      { name: product },
      {
        name: product,
        chatId,
        date: new Date(),
        id: count,
        offer
      }
    );
  };

  updatewishlist = async (product, offer?) => {
    const count = await this.dbconnection
      .collection('wishlist')
      .countDocuments();

    const priceHistory = product.priceHistory ?? [];
    priceHistory.push({
      date: new Date(),
      price: offer.promoPrice || offer.normalPrice
    });

    await this.update(
      { name: product },
      {
        date: new Date(),
        id: count,
        offer,
        priceHistory
      }
    );
  };

  getWishlist = async (chatId) => {
    return this.dbconnection.collection("wishlist").find({ chatId }).toArray();
  };

  getWishlistItemById = async (id) => {
    return this.dbconnection
      .collection("wishlist")
      .find({ id: parseInt(id) })
      .toArray();
  };

  getWishlistByName = async (name) => {
    return this.dbconnection.collection("wishlist").findOne({ name: name });
  };

  async totalCostbyChatId(chatId){
    const list = await this.findByChatId(chatId) as unknown as Offer[];
    let value = 0;
    list.forEach((item: any) => {
      value += parseFloat(item.offer?.normalPrice?.replace('R$','').replace(',','.') ?? '0');
    })
    return value;
  }

  async addToCategory(product, category) {
    await this.update({ name: product }, { category });
  }

  async addQuantity(product, quantity) {
    await this.update({ name: product }, { quantity });
  }
}
