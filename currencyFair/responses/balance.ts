export const full = `{
  "_links": {
    "self": {
      "href": "https://api.currencyfair.com/users/190478/summaries"
    }
  },
  "_embedded": {
    "user_summaries": [
      {
        "lastActivity": "2016-10-26T15:42:03+0100",
        "pendingDepositInfo": {
          "amount": 0,
          "scale": 2
        },
        "pendingTransfersInfo": {
          "amount": 0,
          "scale": 2
        },
        "balanceInfo": {
          "amount": 0,
          "scale": 2
        },
        "openOrdersInfo": {
          "amount": 0,
          "scale": 2
        },
        "fundsAvailableInfo": {
          "amount": 0,
          "scale": 2
        },
        "_embedded": {
          "currency": {
            "currencyCode": "CAD",
            "description": "Canadian Dollar",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/CAD"
              }
            }
          }
        },
        "_links": {
          "self": {
            "href": "https://api.currencyfair.com/users/190478/summaries/CAD"
          }
        }
      },
      {
        "lastActivity": "2016-11-17T21:20:47+0000",
        "pendingDepositInfo": {
          "amount": 0,
          "scale": 2
        },
        "pendingTransfersInfo": {
          "amount": 0,
          "scale": 2
        },
        "balanceInfo": {
          "amount": 207.12,
          "scale": 2
        },
        "openOrdersInfo": {
          "amount": 0,
          "scale": 2
        },
        "fundsAvailableInfo": {
          "amount": 207.12,
          "scale": 2
        },
        "_embedded": {
          "currency": {
            "currencyCode": "CHF",
            "description": "Swiss Franc",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/CHF"
              }
            }
          }
        },
        "_links": {
          "self": {
            "href": "https://api.currencyfair.com/users/190478/summaries/CHF"
          }
        }
      },
      {
        "lastActivity": "2016-11-22T09:14:03+0000",
        "pendingDepositInfo": {
          "amount": 0,
          "scale": 2
        },
        "pendingTransfersInfo": {
          "amount": 0,
          "scale": 2
        },
        "balanceInfo": {
          "amount": 117.38,
          "scale": 2
        },
        "openOrdersInfo": {
          "amount": 0,
          "scale": 2
        },
        "fundsAvailableInfo": {
          "amount": 117.38,
          "scale": 2
        },
        "_embedded": {
          "currency": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          }
        },
        "_links": {
          "self": {
            "href": "https://api.currencyfair.com/users/190478/summaries/EUR"
          }
        }
      },
      {
        "lastActivity": "2017-01-19T22:41:18+0000",
        "pendingDepositInfo": {
          "amount": 0,
          "scale": 2
        },
        "pendingTransfersInfo": {
          "amount": 0,
          "scale": 2
        },
        "balanceInfo": {
          "amount": 466.99,
          "scale": 2
        },
        "openOrdersInfo": {
          "amount": 0,
          "scale": 2
        },
        "fundsAvailableInfo": {
          "amount": 466.99,
          "scale": 2
        },
        "_embedded": {
          "currency": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          }
        },
        "_links": {
          "self": {
            "href": "https://api.currencyfair.com/users/190478/summaries/GBP"
          }
        }
      },
      {
        "lastActivity": "2016-08-19T00:14:06+0100",
        "pendingDepositInfo": {
          "amount": 0,
          "scale": 2
        },
        "pendingTransfersInfo": {
          "amount": 0,
          "scale": 2
        },
        "balanceInfo": {
          "amount": 9.03,
          "scale": 2
        },
        "openOrdersInfo": {
          "amount": 0,
          "scale": 2
        },
        "fundsAvailableInfo": {
          "amount": 9.03,
          "scale": 2
        },
        "_embedded": {
          "currency": {
            "currencyCode": "NZD",
            "description": "New Zealand Dollar",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/NZD"
              }
            }
          }
        },
        "_links": {
          "self": {
            "href": "https://api.currencyfair.com/users/190478/summaries/NZD"
          }
        }
      },
      {
        "lastActivity": "2016-11-18T09:01:00+0000",
        "pendingDepositInfo": {
          "amount": 0,
          "scale": 2
        },
        "pendingTransfersInfo": {
          "amount": 0,
          "scale": 2
        },
        "balanceInfo": {
          "amount": 0,
          "scale": 2
        },
        "openOrdersInfo": {
          "amount": 0,
          "scale": 2
        },
        "fundsAvailableInfo": {
          "amount": 0,
          "scale": 2
        },
        "_embedded": {
          "currency": {
            "currencyCode": "USD",
            "description": "United States Dollar",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/USD"
              }
            }
          }
        },
        "_links": {
          "self": {
            "href": "https://api.currencyfair.com/users/190478/summaries/USD"
          }
        }
      }
    ]
  },
  "total_items": 6
}`;

export const empty = `{
  "_links": {
    "self": {
      "href": "https://api.currencyfair.com/users/195531/summaries"
    }
  },
  "_embedded": {
    "user_summaries": []
  },
  "total_items": 0
}`;