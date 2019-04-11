export const orderShort = `
{
  "lastTransactionID": "251",
  "orderCreateTransaction": {
    "accountID": "101-004-3555295-001",
    "batchID": "250",
    "id": "250",
    "instrument": "EUR_USD",
    "positionFill": "DEFAULT",
    "reason": "CLIENT_ORDER",
    "time": "2016-09-21T14:25:22.657981460Z",
    "timeInForce": "FOK",
    "type": "MARKET_ORDER",
    "units": "-5",
    "userID": 3555295
  },
  "orderFillTransaction": {
    "accountBalance": "100394.5544",
    "accountID": "101-004-3555295-001",
    "batchID": "250",
    "financing": "0.0000",
    "id": "251",
    "instrument": "EUR_USD",
    "orderID": "250",
    "pl": "0.0000",
    "price": "1.11446",
    "reason": "MARKET_ORDER",
    "time": "2016-09-21T14:25:22.657981460Z",
    "tradeOpened": {
      "tradeID": "251",
      "units": "-5"
    },
    "type": "ORDER_FILL",
    "units": "-5",
    "userID": 3555295
  },
  "relatedTransactionIDs": [
    "250",
    "251"
  ]
}
`.trim();

export const orderLong = `
{
  "lastTransactionID": "251",
  "orderCreateTransaction": {
    "accountID": "101-004-3555295-001",
    "batchID": "250",
    "id": "250",
    "instrument": "EUR_USD",
    "positionFill": "DEFAULT",
    "reason": "CLIENT_ORDER",
    "time": "2016-09-21T14:25:22.657981460Z",
    "timeInForce": "FOK",
    "type": "MARKET_ORDER",
    "units": "5",
    "userID": 3555295
  },
  "orderFillTransaction": {
    "accountBalance": "100394.5544",
    "accountID": "101-004-3555295-001",
    "batchID": "250",
    "financing": "0.0000",
    "id": "251",
    "instrument": "EUR_USD",
    "orderID": "250",
    "pl": "0.0000",
    "price": "1.11446",
    "reason": "MARKET_ORDER",
    "time": "2016-09-21T14:25:22.657981460Z",
    "tradeOpened": {
      "tradeID": "251",
      "units": "5"
    },
    "type": "ORDER_FILL",
    "units": "5",
    "userID": 3555295
  },
  "relatedTransactionIDs": [
    "250",
    "251"
  ]
}
`.trim();