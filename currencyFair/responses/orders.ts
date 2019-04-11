export const orders = `
{
  "_links": {
    "self": {
      "href": "https://api.currencyfair.com/users/190478/orders?page=1"
    },
    "first": {
      "href": "https://api.currencyfair.com/users/190478/orders"
    },
    "last": {
      "href": "https://api.currencyfair.com/users/190478/orders?page=5"
    },
    "next": {
      "href": "https://api.currencyfair.com/users/190478/orders?page=2"
    }
  },
  "_embedded": {
    "orders": [
      {
        "id": 228985294,
        "created": "2016-09-21T22:21:25+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.47,
            "scale": 4
          },
          "inverse": {
            "rate": 0.6803,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 14.7,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 6,
          "message": "Pending"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 7,
              "message": "Unmatched"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228985294"
          }
        }
      },
      {
        "id": 228979568,
        "created": "2016-09-21T22:07:41+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.47,
            "scale": 4
          },
          "inverse": {
            "rate": 0.6803,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 10,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228979568"
          }
        }
      },
      {
        "id": 228978782,
        "created": "2016-09-21T22:05:59+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.47,
            "scale": 4
          },
          "inverse": {
            "rate": 0.6803,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 10,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228978782"
          }
        }
      },
      {
        "id": 228977096,
        "created": "2016-09-21T22:02:24+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.47,
            "scale": 4
          },
          "inverse": {
            "rate": 0.6803,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 12,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 12,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228977096"
          }
        }
      },
      {
        "id": 228977095,
        "created": "2016-09-21T22:02:22+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.47,
            "scale": 4
          },
          "inverse": {
            "rate": 0.6803,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 10,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228977095"
          }
        }
      },
      {
        "id": 228571785,
        "created": "2016-09-20T19:12:32+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8608,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1617,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 117,
            "scale": 2
          },
          "buy": {
            "amount": 100.71,
            "scale": 2
          },
          "estimated": {
            "amount": 100.71,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-20T19:18:31+01:00",
            "rateInfo": {
              "standard": {
                "rate": 0.8608,
                "scale": 4
              },
              "inverse": {
                "rate": 1.1617,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 117,
                "scale": 2
              },
              "buy": {
                "amount": 100.71,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228571785"
          }
        }
      },
      {
        "id": 228366475,
        "created": "2016-09-19T20:38:19+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1679,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8562,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 100,
            "scale": 2
          },
          "buy": {
            "amount": 116.79,
            "scale": 2
          },
          "estimated": {
            "amount": 116.79,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-19T20:47:25+01:00",
            "rateInfo": {
              "standard": {
                "rate": 1.1679,
                "scale": 4
              },
              "inverse": {
                "rate": 0.8562,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 100,
                "scale": 2
              },
              "buy": {
                "amount": 116.79,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228366475"
          }
        }
      },
      {
        "id": 228363434,
        "created": "2016-09-19T20:13:19+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1679,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8562,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 100,
            "scale": 2
          },
          "buy": {
            "amount": 116.79,
            "scale": 2
          },
          "estimated": {
            "amount": 116.79,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-19T20:34:08+01:00",
            "rateInfo": {
              "standard": {
                "rate": 1.1679,
                "scale": 4
              },
              "inverse": {
                "rate": 0.8562,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 100,
                "scale": 2
              },
              "buy": {
                "amount": 116.79,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228363434"
          }
        }
      },
      {
        "id": 228334184,
        "created": "2016-09-19T16:59:31+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1689,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8555,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 100,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 100,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228334184"
          }
        }
      },
      {
        "id": 228332456,
        "created": "2016-09-19T16:49:16+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1694,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8551,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 100,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 100,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228332456"
          }
        }
      },
      {
        "id": 228281150,
        "created": "2016-09-19T11:11:52+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8571,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1667,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 101.14,
            "scale": 2
          },
          "estimated": {
            "amount": 101.14,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-19T11:13:00+01:00",
            "rateInfo": {
              "standard": {
                "rate": 0.8571,
                "scale": 4
              },
              "inverse": {
                "rate": 1.1667,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 118,
                "scale": 2
              },
              "buy": {
                "amount": 101.14,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228281150"
          }
        }
      },
      {
        "id": 228263007,
        "created": "2016-09-19T09:29:13+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1728,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8527,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 100,
            "scale": 2
          },
          "buy": {
            "amount": 117.28,
            "scale": 2
          },
          "estimated": {
            "amount": 117.28,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-19T09:33:56+01:00",
            "rateInfo": {
              "standard": {
                "rate": 1.1728,
                "scale": 4
              },
              "inverse": {
                "rate": 0.8527,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 99.46,
                "scale": 2
              },
              "buy": {
                "amount": 116.64,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 8,
              "message": "Matched in Part"
            }
          },
          {
            "created": "2016-09-19T09:33:56+01:00",
            "rateInfo": {
              "standard": {
                "rate": 1.1728,
                "scale": 4
              },
              "inverse": {
                "rate": 0.8527,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0.54,
                "scale": 2
              },
              "buy": {
                "amount": 0.64,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228263007"
          }
        }
      },
      {
        "id": 228260008,
        "created": "2016-09-19T09:08:17+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8549,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1697,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 12,
            "scale": 2
          },
          "buy": {
            "amount": 10.26,
            "scale": 2
          },
          "estimated": {
            "amount": 10.26,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-19T09:08:25+01:00",
            "rateInfo": {
              "standard": {
                "rate": 0.8549,
                "scale": 4
              },
              "inverse": {
                "rate": 1.1697,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 12,
                "scale": 2
              },
              "buy": {
                "amount": 10.26,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228260008"
          }
        }
      },
      {
        "id": 228258821,
        "created": "2016-09-19T09:04:31+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8548,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1699,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 12,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 12,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228258821"
          }
        }
      },
      {
        "id": 228258438,
        "created": "2016-09-19T09:03:17+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1717,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8535,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 11.72,
            "scale": 2
          },
          "estimated": {
            "amount": 11.72,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-09-19T09:03:27+01:00",
            "rateInfo": {
              "standard": {
                "rate": 1.1717,
                "scale": 4
              },
              "inverse": {
                "rate": 0.8535,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 10,
                "scale": 2
              },
              "buy": {
                "amount": 11.72,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228258438"
          }
        }
      },
      {
        "id": 228257950,
        "created": "2016-09-19T08:59:46+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1713,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8538,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 10,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228257950"
          }
        }
      },
      {
        "id": 228257747,
        "created": "2016-09-19T08:56:18+01:00",
        "rateInfo": {
          "standard": {
            "rate": 1.1713,
            "scale": 4
          },
          "inverse": {
            "rate": 0.8538,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 10,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 10,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "GBP",
            "description": "Pound Sterling",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/GBP"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/228257747"
          }
        }
      },
      {
        "id": 223562637,
        "created": "2016-08-26T09:43:14+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8548,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1699,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 100.86,
            "scale": 2
          },
          "estimated": {
            "amount": 100.86,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 9,
          "message": "Matched in Full"
        },
        "details": [
          {
            "created": "2016-08-26T09:43:31+01:00",
            "rateInfo": {
              "standard": {
                "rate": 0.8548,
                "scale": 4
              },
              "inverse": {
                "rate": 1.1699,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 118,
                "scale": 2
              },
              "buy": {
                "amount": 100.86,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 9,
              "message": "Matched in Full"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223562637"
          }
        }
      },
      {
        "id": 223562116,
        "created": "2016-08-26T09:40:14+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8547,
            "scale": 4
          },
          "inverse": {
            "rate": 1.17,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223562116"
          }
        }
      },
      {
        "id": 223561925,
        "created": "2016-08-26T09:38:29+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8548,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1699,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223561925"
          }
        }
      },
      {
        "id": 223561790,
        "created": "2016-08-26T09:37:14+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8547,
            "scale": 4
          },
          "inverse": {
            "rate": 1.17,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223561790"
          }
        }
      },
      {
        "id": 223561640,
        "created": "2016-08-26T09:35:44+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8549,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1697,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223561640"
          }
        }
      },
      {
        "id": 223560647,
        "created": "2016-08-26T09:32:14+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8547,
            "scale": 4
          },
          "inverse": {
            "rate": 1.17,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223560647"
          }
        }
      },
      {
        "id": 223560239,
        "created": "2016-08-26T09:30:59+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8548,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1699,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223560239"
          }
        }
      },
      {
        "id": 223560074,
        "created": "2016-08-26T09:29:44+01:00",
        "rateInfo": {
          "standard": {
            "rate": 0.8552,
            "scale": 4
          },
          "inverse": {
            "rate": 1.1693,
            "scale": 4
          }
        },
        "amountInfo": {
          "sell": {
            "amount": 118,
            "scale": 2
          },
          "buy": {
            "amount": 0,
            "scale": 2
          },
          "estimated": {
            "amount": 118,
            "scale": 2
          }
        },
        "statusInfo": {
          "status": 3,
          "message": "Cancelled"
        },
        "details": [
          {
            "created": null,
            "rateInfo": {
              "standard": {
                "rate": 0,
                "scale": 4
              },
              "inverse": {
                "rate": 0,
                "scale": 4
              }
            },
            "amountInfo": {
              "sell": {
                "amount": 0,
                "scale": 2
              },
              "buy": {
                "amount": null,
                "scale": 2
              }
            },
            "statusInfo": {
              "status": 3,
              "message": "Cancelled"
            }
          }
        ],
        "aqt": {
          "id": null,
          "status": null
        },
        "_embedded": {
          "currencyFrom": {
            "currencyCode": "EUR",
            "description": "Euro",
            "minimumSellAmount": 5,
            "_links": {
              "self": {
                "href": "https://api.currencyfair.com/currencies/EUR"
              }
            }
          },
          "currencyTo": {
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
            "href": "https://api.currencyfair.com/users/190478/orders/223560074"
          }
        }
      }
    ]
  },
  "page_count": 5,
  "page_size": 25,
  "total_items": 111,
  "page": 1
}
`.trim();

export const empty = `
{
  "_links": {
    "self": {
      "href": "https://api.currencyfair.com/users/195531/orders?page_size=10&page=1&status=9,6,3&order_by=date&order_direction=desc"
    }
  },
  "_embedded": {
    "orders": []
  },
  "page_count": 0,
  "page_size": 10,
  "total_items": 0,
  "page": 0
}
`.trim();