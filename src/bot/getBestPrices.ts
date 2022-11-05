require("dotenv").config();

import { scoutGoogleShopping } from "./navigator";
import { Db } from "mongodb";
import { Offer } from "../shared/interfaces/offer";

export class PriceFinder {
  constructor(private dbconnection: Db) {}

  getPrices = async (query, config?) => {
    return scoutGoogleShopping(query, config, this.dbconnection).then(googleOffers => {
      console.log({googleOffers})
      let bestOffer:any = {normalPrice:Number.MAX_VALUE, promoPrice:Number.MAX_VALUE};
      for(const offer of googleOffers.offers) {
        const element = offer;
        if(element.merchant.offers){
          const product_offers = element.merchant.offers;
          product_offers.forEach((_offer, idx) => {
            //if(_offer?.features?.toLocaleLowerCase().includes(query.toLocaleLowerCase())){
              bestOffer = this.filterBestPrice(_offer,bestOffer,idx);
            //}
          })
        }
      }
      const candidates = [];
      googleOffers.offers.forEach(offer=> {
        const result = offer.merchant.offers.find(merchOffer => {
          return merchOffer.promoPrice === bestOffer.promoPrice;
        });
        result && candidates.push(result);
      })
      try{
        bestOffer.candidates.unshift({link:candidates[0].link, store: candidates[0].store})
      }catch(ex){}
      console.log({bestOffer})
      return bestOffer as Offer;
    });
  };

  private filterBestPrice(offer, bestOffer, idx){
    if(offer.link && offer.normalPrice != '' || offer.normalPrice != '' && offer.store){
              
      //const offerPrice = parseFloat((offer.normalPrice).replace('R$','').replace(',','.'));
      const offerPromo = parseFloat((offer.promoPrice).replace('R$','').replace(',','.'));

      const bestOfferPromo = parseFloat(bestOffer.promoPrice.toString().replace('R$','').replace(',','.'));
      //console.log(_offer.store);
      //console.log(offerPromo, bestOfferPromo);
      
      if(/*(offerPrice < bestOffer.normalPrice) || */offerPromo <= bestOfferPromo){
        if(idx > 1 && bestOfferPromo - offerPromo >= 500) return bestOffer;
        console.log({'best offer: ': offerPromo, store:offer.store });
        if(offerPromo === bestOfferPromo) {
          if(!bestOffer.candidates) bestOffer.candidates = [];
          bestOffer.candidates.push({link:offer.link, store: offer.store});
        }
        Object.assign(offer, {candidates: bestOffer.candidates});
        return offer;
      }
    }
    return bestOffer;
  }

  getPricesArray = async (query, force = false) => {
    const offers: any = [];

    query.forEach(async (q) => {
      offers.push(await this.getPrices(q));
    });
    return offers;
  };
  
  getGroceryPricesArray = async (query) => {
    const offers: any = [];

    query.forEach(async (q) => {
      offers.push(await this.getPrices(q, { useMerchants: false }));
    });
    return offers;
  };
}
