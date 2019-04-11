export const pending = `
{
  "id": 228985295,
  "created": "2016-09-21T22:21:27+01:00",
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
      "amount": null,
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
          "href": "https:\\/\\/api.currencyfair.com\\/currencies\\/GBP"
        }
      }
    },
    "currencyTo": {
      "currencyCode": "EUR",
      "description": "Euro",
      "minimumSellAmount": 5,
      "_links": {
        "self": {
          "href": "https:\\/\\/api.currencyfair.com\\/currencies\\/EUR"
        }
      }
    }
  },
  "_links": {
    "self": {
      "href": "https:\\/\\/api.currencyfair.com\\/users\\/190478\\/orders\\/228985295"
    }
  }
}
`.trim();

export const completed = `
{
  "id": 234190351,
  "created": "2016-10-14T10:03:33+01:00",
  "rateInfo": {
    "standard": {
      "rate": 1.1094,
      "scale": 4
    },
    "inverse": {
      "rate": 0.9014,
      "scale": 4
    }
  },
  "amountInfo": {
    "sell": {
      "amount": 300,
      "scale": 2
    },
    "buy": {
      "amount": 332.82,
      "scale": 2
    },
    "estimated": {
      "amount": 332.82,
      "scale": 2
    }
  },
  "statusInfo": {
    "status": 9,
    "message": "Matched in Full"
  },
  "details": [
    {
      "created": "2016-10-14T10:03:35+01:00",
      "rateInfo": {
        "standard": {
          "rate": 1.1094,
          "scale": 4
        },
        "inverse": {
          "rate": 0.9014,
          "scale": 4
        }
      },
      "amountInfo": {
        "sell": {
          "amount": 300,
          "scale": 2
        },
        "buy": {
          "amount": 332.82,
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
      "href": "https://api.currencyfair.com/users/190478/orders/234190351"
    }
  }
}
`.trim();

export const partial40 = `
{
  "id": 234192372,
  "created": "2016-10-14T10:16:18+01:00",
  "rateInfo": {
    "standard": {
      "rate": 0.9025,
      "scale": 4
    },
    "inverse": {
      "rate": 1.108,
      "scale": 4
    }
  },
  "amountInfo": {
    "sell": {
      "amount": 332.82,
      "scale": 2
    },
    "buy": {
      "amount": 125,
      "scale": 2
    },
    "estimated": {
      "amount": 300.3738,
      "scale": 2
    }
  },
  "statusInfo": {
    "status": 6,
    "message": "Pending"
  },
  "details": [
    {
      "created": "2016-10-14T10:16:51+01:00",
      "rateInfo": {
        "standard": {
          "rate": 0.9025,
          "scale": 4
        },
        "inverse": {
          "rate": 1.108,
          "scale": 4
        }
      },
      "amountInfo": {
        "sell": {
          "amount": 138.5,
          "scale": 2
        },
        "buy": {
          "amount": 125,
          "scale": 2
        }
      },
      "statusInfo": {
        "status": 8,
        "message": "Matched in Part"
      }
    },
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
      "href": "https://api.currencyfair.com/users/190478/orders/234192372"
    }
  }
}
`.trim();

export const partial80 = `
{
  "id": 234192372,
  "created": "2016-10-14T10:16:18+01:00",
  "rateInfo": {
    "standard": {
      "rate": 0.9025,
      "scale": 4
    },
    "inverse": {
      "rate": 1.108,
      "scale": 4
    }
  },
  "amountInfo": {
    "sell": {
      "amount": 332.82,
      "scale": 2
    },
    "buy": {
      "amount": 250,
      "scale": 2
    },
    "estimated": {
      "amount": 300.3738,
      "scale": 2
    }
  },
  "statusInfo": {
    "status": 6,
    "message": "Pending"
  },
  "details": [
    {
      "created": "2016-10-14T10:16:51+01:00",
      "rateInfo": {
        "standard": {
          "rate": 0.9025,
          "scale": 4
        },
        "inverse": {
          "rate": 1.108,
          "scale": 4
        }
      },
      "amountInfo": {
        "sell": {
          "amount": 138.5,
          "scale": 2
        },
        "buy": {
          "amount": 125,
          "scale": 2
        }
      },
      "statusInfo": {
        "status": 8,
        "message": "Matched in Part"
      }
    },
    {
      "created": "2016-10-14T10:16:51+01:00",
      "rateInfo": {
        "standard": {
          "rate": 0.9025,
          "scale": 4
        },
        "inverse": {
          "rate": 1.108,
          "scale": 4
        }
      },
      "amountInfo": {
        "sell": {
          "amount": 138.5,
          "scale": 2
        },
        "buy": {
          "amount": 125,
          "scale": 2
        }
      },
      "statusInfo": {
        "status": 8,
        "message": "Matched in Part"
      }
    },
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
      "href": "https://api.currencyfair.com/users/190478/orders/234192372"
    }
  }
}
`.trim();

export const cancelled = `
{
  "id": 234192128,
  "created": "2016-10-14T10:15:03+01:00",
  "rateInfo": {
    "standard": {
      "rate": 0.9026,
      "scale": 4
    },
    "inverse": {
      "rate": 1.1079,
      "scale": 4
    }
  },
  "amountInfo": {
    "sell": {
      "amount": 332.82,
      "scale": 2
    },
    "buy": {
      "amount": 0,
      "scale": 2
    },
    "estimated": {
      "amount": 332.82,
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
      "href": "https://api.currencyfair.com/users/190478/orders/234192128"
    }
  }
}
`.trim();

export const cancelled40 = `
{
  "id": 234192372,
  "created": "2016-10-14T10:16:18+01:00",
  "rateInfo": {
    "standard": {
      "rate": 0.9025,
      "scale": 4
    },
    "inverse": {
      "rate": 1.108,
      "scale": 4
    }
  },
  "amountInfo": {
    "sell": {
      "amount": 332.82,
      "scale": 2
    },
    "buy": {
      "amount": 125,
      "scale": 2
    },
    "estimated": {
      "amount": 300.3738,
      "scale": 2
    }
  },
  "statusInfo": {
    "status": 3,
    "message": "Cancelled"
  },
  "details": [
    {
      "created": "2016-10-14T10:16:51+01:00",
      "rateInfo": {
        "standard": {
          "rate": 0.9025,
          "scale": 4
        },
        "inverse": {
          "rate": 1.108,
          "scale": 4
        }
      },
      "amountInfo": {
        "sell": {
          "amount": 138.5,
          "scale": 2
        },
        "buy": {
          "amount": 125,
          "scale": 2
        }
      },
      "statusInfo": {
        "status": 8,
        "message": "Matched in Part"
      }
    },
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
      "href": "https://api.currencyfair.com/users/190478/orders/234192372"
    }
  }
}
`.trim();

export const update = `{
  "id": 236844209,
  "created": "2016-10-27T13:54:04+01:00",
  "rateInfo": {
    "standard": {
      "rate": 1.1194,
      "scale": 4
    },
    "inverse": {
      "rate": 0.8933,
      "scale": 4
    }
  },
  "amountInfo": {
    "sell": {
      "amount": 100,
      "scale": 2
    },
    "buy": {
      "amount": 52.76,
      "scale": 2
    },
    "estimated": {
      "amount": null,
      "scale": 2
    }
  },
  "statusInfo": {
    "status": 3,
    "message": "Cancelled"
  },
  "details": [
    {
      "created": "2016-10-27T13:54:17+01:00",
      "rateInfo": {
        "standard": {
          "rate": 1.1194,
          "scale": 4
        },
        "inverse": {
          "rate": 0.8933,
          "scale": 4
        }
      },
      "amountInfo": {
        "sell": {
          "amount": 47.14,
          "scale": 2
        },
        "buy": {
          "amount": 52.76,
          "scale": 2
        }
      },
      "statusInfo": {
        "status": 8,
        "message": "Matched in Part"
      }
    },
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
      "href": "https://api.currencyfair.com/users/190478/orders/236844209"
    }
  }
}
`.trim();