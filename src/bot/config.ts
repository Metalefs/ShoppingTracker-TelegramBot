import { GoogleShoppingMerchants } from "../models/googleShoppingMerchants"
import { Store } from "../models/stores"

export const config = {
    websites: {
        googleShopping: function (query) {
            return `https://www.google.com.br/search?tbm=shop&q=${query.replace(/\s/g,'+')}`
        }
    },
    acceptedStores: [
        Store.Amazon,
        Store["Casas Bahia"],
        Store["Magazine Luisa"],
        Store["Mercado Livre"],
        Store["Ponto Frio"],
        Store.Americanas,
        Store["Extra"],
        Store["Kabum"],
    ],
    merchants: [
        GoogleShoppingMerchants.Amazon,
        GoogleShoppingMerchants["Casas Bahia"],
        GoogleShoppingMerchants["Magazine Luisa"],
        GoogleShoppingMerchants["Mercado Livre"],
        GoogleShoppingMerchants["Ponto Frio"],
        GoogleShoppingMerchants.Americanas,
        GoogleShoppingMerchants.Extra,
        GoogleShoppingMerchants.Kabum,
    ]
}