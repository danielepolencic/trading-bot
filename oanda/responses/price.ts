export const price = `
{
  "prices": [
    {
      "asks": [
        {
          "liquidity": 1000000,
          "price": "0.85868"
        },
        {
          "liquidity": 2000000,
          "price": "0.85869"
        },
        {
          "liquidity": 5000000,
          "price": "0.85870"
        },
        {
          "liquidity": 10000000,
          "price": "0.85872"
        }
      ],
      "bids": [
        {
          "liquidity": 1000000,
          "price": "0.85854"
        },
        {
          "liquidity": 2000000,
          "price": "0.85853"
        },
        {
          "liquidity": 5000000,
          "price": "0.85852"
        },
        {
          "liquidity": 10000000,
          "price": "0.85850"
        }
      ],
      "closeoutAsk": "0.85872",
      "closeoutBid": "0.85850",
      "instrument": "EUR_GBP",
      "quoteHomeConversionFactors": {
        "negativeUnits": "1.00000000",
        "positiveUnits": "1.00000000"
      },
      "status": "tradeable",
      "time": "2016-09-21T14:25:18.558780133Z",
      "unitsAvailable": {
        "default": {
          "long": "5845775",
          "short": "5846908"
        },
        "openOnly": {
          "long": "5845775",
          "short": "5846908"
        },
        "reduceFirst": {
          "long": "5845775",
          "short": "5846908"
        },
        "reduceOnly": {
          "long": "0",
          "short": "0"
        }
      }
    }
  ]
}
`.trim();

export const invalid = `
{
  "prices": [
    {
      "instrument": "GBP_EUR",
      "status": "invalid"
    }
  ]
}
`.trim();