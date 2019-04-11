export const partialProgress = `{
  "id": 236844209,
  "tradeType": "MARKET_PLACE",
  "tradeMode": "SELL",
  "rateInfo": {
    "rate": 1.1194,
    "scale": 4
  },
  "statusInfo": {
    "status": 6,
    "message": "Pending"
  },
  "events": [
    {
      "id": 208476,
      "tradeId": 236847406,
      "eventType": "UPDATED",
      "amountInfo": {
        "buy": {
          "amount": 59.166198,
          "scale": 2
        },
        "sell": {
          "amount": 52.86,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1193,
        "scale": 4
      },
      "created": "2016-10-27T14:02:50+01:00",
      "tradeTime": "2016-10-27T14:02:50+01:00"
    },
    {
      "id": 208465,
      "tradeId": 236844209,
      "eventType": "CREATED",
      "amountInfo": {
        "buy": {
          "amount": 111.94,
          "scale": 2
        },
        "sell": {
          "amount": 100,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1194,
        "scale": 4
      },
      "created": "2016-10-27T13:54:04+01:00",
      "tradeTime": "2016-10-27T13:54:04+01:00"
    },
    {
      "id": 208466,
      "tradeId": 236844209,
      "eventType": "PART_MATCHED",
      "amountInfo": {
        "buy": {
          "amount": 52.768516,
          "scale": 2
        },
        "sell": {
          "amount": 47.14,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1194,
        "scale": 4
      },
      "created": "2016-10-27T13:54:17+01:00",
      "tradeTime": "2016-10-27T13:54:04+01:00"
    }
  ],
  "created": "2016-10-27T13:54:04+01:00",
  "updated": "2016-10-27T14:02:50+01:00",
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
      "href": "https://api.currencyfair.com/users/190478/orders/236844209/history"
    }
  }
}`.trim();

export const partialCancelled = `{
  "id": 236844209,
  "tradeType": "MARKET_PLACE",
  "tradeMode": "SELL",
  "rateInfo": {
    "rate": 1.1194,
    "scale": 4
  },
  "statusInfo": {
    "status": 3,
    "message": "Cancelled"
  },
  "events": [
    {
      "id": 208476,
      "tradeId": 236847406,
      "eventType": "UPDATED",
      "amountInfo": {
        "buy": {
          "amount": 59.166198,
          "scale": 2
        },
        "sell": {
          "amount": 52.86,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1193,
        "scale": 4
      },
      "created": "2016-10-27T14:02:50+01:00",
      "tradeTime": "2016-10-27T14:02:50+01:00"
    },
    {
      "id": 208465,
      "tradeId": 236844209,
      "eventType": "CREATED",
      "amountInfo": {
        "buy": {
          "amount": 111.94,
          "scale": 2
        },
        "sell": {
          "amount": 100,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1194,
        "scale": 4
      },
      "created": "2016-10-27T13:54:04+01:00",
      "tradeTime": "2016-10-27T13:54:04+01:00"
    },
    {
      "id": 208466,
      "tradeId": 236844209,
      "eventType": "PART_MATCHED",
      "amountInfo": {
        "buy": {
          "amount": 52.768516,
          "scale": 2
        },
        "sell": {
          "amount": 47.14,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1194,
        "scale": 4
      },
      "created": "2016-10-27T13:54:17+01:00",
      "tradeTime": "2016-10-27T13:54:04+01:00"
    },
    {
      "id": 208541,
      "tradeId": 236847406,
      "eventType": "CANCELLED",
      "amountInfo": {
        "buy": {
          "amount": 59.166198,
          "scale": 2
        },
        "sell": {
          "amount": 52.86,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1193,
        "scale": 4
      },
      "created": "2016-10-27T14:10:16+01:00",
      "tradeTime": "2016-10-27T14:02:50+01:00"
    }
  ],
  "created": "2016-10-27T13:54:04+01:00",
  "updated": "2016-10-27T14:10:16+01:00",
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
      "href": "https://api.currencyfair.com/users/190478/orders/236844209/history"
    }
  }
}`.trim();

export const completed = `{
  "id": 236782275,
  "tradeType": "MARKET_PLACE",
  "tradeMode": "SELL",
  "rateInfo": {
    "rate": 1.2149,
    "scale": 4
  },
  "statusInfo": {
    "status": 9,
    "message": "Matched in Full"
  },
  "events": [
    {
      "id": 207425,
      "tradeId": 236782275,
      "eventType": "CREATED",
      "amountInfo": {
        "buy": {
          "amount": 194.384,
          "scale": 2
        },
        "sell": {
          "amount": 160,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.2149,
        "scale": 4
      },
      "created": "2016-10-27T09:20:37+01:00",
      "tradeTime": "2016-10-27T09:20:37+01:00"
    },
    {
      "id": 207427,
      "tradeId": 236782275,
      "eventType": "MATCHED",
      "amountInfo": {
        "buy": {
          "amount": 194.384,
          "scale": 2
        },
        "sell": {
          "amount": 160,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.2149,
        "scale": 4
      },
      "created": "2016-10-27T09:22:16+01:00",
      "tradeTime": "2016-10-27T09:20:37+01:00"
    }
  ],
  "created": "2016-10-27T09:20:37+01:00",
  "updated": "2016-10-27T09:22:16+01:00",
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
      "href": "https://api.currencyfair.com/users/190478/orders/236782275/history"
    }
  }
}`.trim();

export const cancelled = `{
  "id": 236842754,
  "tradeType": "MARKET_PLACE",
  "tradeMode": "SELL",
  "rateInfo": {
    "rate": 1.1199,
    "scale": 4
  },
  "statusInfo": {
    "status": 3,
    "message": "Cancelled"
  },
  "events": [
    {
      "id": 208452,
      "tradeId": 236842754,
      "eventType": "CANCELLED",
      "amountInfo": {
        "buy": {
          "amount": 111.99,
          "scale": 2
        },
        "sell": {
          "amount": 100,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1199,
        "scale": 4
      },
      "created": "2016-10-27T13:47:48+01:00",
      "tradeTime": "2016-10-27T13:47:17+01:00"
    },
    {
      "id": 208440,
      "tradeId": 236842754,
      "eventType": "CREATED",
      "amountInfo": {
        "buy": {
          "amount": 111.99,
          "scale": 2
        },
        "sell": {
          "amount": 100,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1199,
        "scale": 4
      },
      "created": "2016-10-27T13:47:16+01:00",
      "tradeTime": "2016-10-27T13:47:17+01:00"
    }
  ],
  "created": "2016-10-27T13:47:16+01:00",
  "updated": "2016-10-27T13:47:48+01:00",
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
      "href": "https://api.currencyfair.com/users/190478/orders/236842754/history"
    }
  }
}`.trim();

export const pending = `{
  "id": 236850805,
  "tradeType": "MARKET_PLACE",
  "tradeMode": "SELL",
  "rateInfo": {
    "rate": 1.1433,
    "scale": 4
  },
  "statusInfo": {
    "status": 6,
    "message": "Pending"
  },
  "events": [
    {
      "id": 208572,
      "tradeId": 236850805,
      "eventType": "CREATED",
      "amountInfo": {
        "buy": {
          "amount": 5.7165,
          "scale": 2
        },
        "sell": {
          "amount": 5,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 1.1433,
        "scale": 4
      },
      "created": "2016-10-27T14:17:25+01:00",
      "tradeTime": "2016-10-27T14:17:24+01:00"
    }
  ],
  "created": "2016-10-27T14:17:25+01:00",
  "updated": "2016-10-27T14:17:25+01:00",
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
      "href": "https://api.currencyfair.com/users/190478/orders/236850805/history"
    }
  }
}`.trim();

export const partialCompleted = `{
  "id": 236184631,
  "tradeType": "MARKET_PLACE",
  "tradeMode": "SELL",
  "rateInfo": {
    "rate": 0.8913,
    "scale": 4
  },
  "statusInfo": {
    "status": 9,
    "message": "Matched in Full"
  },
  "events": [
    {
      "id": 199685,
      "tradeId": 236184631,
      "eventType": "PART_MATCHED",
      "amountInfo": {
        "buy": {
          "amount": 24.136404,
          "scale": 2
        },
        "sell": {
          "amount": 27.08,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 0.8913,
        "scale": 4
      },
      "created": "2016-10-25T10:44:03+01:00",
      "tradeTime": "2016-10-25T10:43:27+01:00"
    },
    {
      "id": 199687,
      "tradeId": 236184926,
      "eventType": "MATCHED",
      "amountInfo": {
        "buy": {
          "amount": 379.675974,
          "scale": 2
        },
        "sell": {
          "amount": 425.98,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 0.8913,
        "scale": 4
      },
      "created": "2016-10-25T10:44:07+01:00",
      "tradeTime": "2016-10-25T10:44:03+01:00"
    },
    {
      "id": 199667,
      "tradeId": 236184631,
      "eventType": "CREATED",
      "amountInfo": {
        "buy": {
          "amount": 403.812378,
          "scale": 2
        },
        "sell": {
          "amount": 453.06,
          "scale": 2
        }
      },
      "rateInfo": {
        "rate": 0.8913,
        "scale": 4
      },
      "created": "2016-10-25T10:43:27+01:00",
      "tradeTime": "2016-10-25T10:43:27+01:00"
    }
  ],
  "created": "2016-10-25T10:43:27+01:00",
  "updated": "2016-10-25T10:44:03+01:00",
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
      "href": "https://api.currencyfair.com/users/27954/orders/236184631/history"
    }
  }
}`.trim();