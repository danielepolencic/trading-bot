export const tradeLong = `
{
  "lastTransactionID": "6397",
  "trade": {
    "clientExtensions": {
      "id": "my_eur_usd_trade"
    },
    "currentUnits": "100",
    "financing": "0.00000",
    "id": "6395",
    "initialUnits": "100",
    "instrument": "EUR_USD",
    "openTime": "2016-06-22T18:41:48.258142231Z",
    "price": "1.13033",
    "realizedPL": "0.00000",
    "state": "OPEN",
    "unrealizedPL": "-0.01438"
  }
}
`.trim();

export const tradeShort = `
{
  "lastTransactionID": "6397",
  "trade": {
    "clientExtensions": {
      "id": "my_eur_usd_trade"
    },
    "currentUnits": "-100",
    "financing": "0.00000",
    "id": "6395",
    "initialUnits": "-100",
    "instrument": "EUR_USD",
    "openTime": "2016-06-22T18:41:48.258142231Z",
    "price": "1.13033",
    "realizedPL": "0.00000",
    "state": "OPEN",
    "unrealizedPL": "-0.01438"
  }
}
`.trim();