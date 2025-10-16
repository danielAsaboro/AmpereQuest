/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/points_marketplace.json`.
 */
export type PointsMarketplace = {
  "address": "9PQHr2B1MoxNwyjwdvxZcc7VifqKsetsjvikGwxu2Eko",
  "metadata": {
    "name": "pointsMarketplace",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyFromListing",
      "docs": [
        "Buy points from a user listing",
        "Issues a voucher to buyer, seller must transfer points separately"
      ],
      "discriminator": [
        33,
        177,
        3,
        71,
        253,
        212,
        26,
        216
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "listing.seller",
                "account": "pointsListing"
              },
              {
                "kind": "account",
                "path": "listing.created_at",
                "account": "pointsListing"
              }
            ]
          }
        },
        {
          "name": "voucher",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  117,
                  99,
                  104,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "arg",
                "path": "timestamp"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "buyFromMarketplace",
      "docs": [
        "Buy points from marketplace at 50% discount (Web3 users)",
        "Issues a voucher that can be redeemed in charging_session program"
      ],
      "discriminator": [
        231,
        145,
        129,
        126,
        174,
        103,
        193,
        108
      ],
      "accounts": [
        {
          "name": "marketplace",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  112,
                  108,
                  97,
                  99,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "voucher",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  117,
                  99,
                  104,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "arg",
                "path": "timestamp"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "pointsAmount",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "cancelListing",
      "docs": [
        "Cancel a listing",
        "Points remain in seller's account (no transfer needed)"
      ],
      "discriminator": [
        41,
        183,
        50,
        232,
        230,
        233,
        157,
        70
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              },
              {
                "kind": "account",
                "path": "listing.created_at",
                "account": "pointsListing"
              }
            ]
          }
        },
        {
          "name": "seller",
          "signer": true,
          "relations": [
            "listing"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createListing",
      "docs": [
        "Create a sell listing (drivers selling their points)",
        "Note: Seller must have points in their charging_session account",
        "Listing is a commitment - points stay in seller's account until purchase"
      ],
      "discriminator": [
        18,
        168,
        45,
        24,
        191,
        31,
        117,
        54
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              },
              {
                "kind": "arg",
                "path": "timestamp"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "pointsAmount",
          "type": "u64"
        },
        {
          "name": "pricePerPoint",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeMarketplace",
      "docs": [
        "Initialize marketplace"
      ],
      "discriminator": [
        47,
        81,
        64,
        0,
        96,
        56,
        105,
        7
      ],
      "accounts": [
        {
          "name": "marketplace",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  112,
                  108,
                  97,
                  99,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "markVoucherRedeemed",
      "docs": [
        "Mark a voucher as redeemed (CPI from charging_session program)",
        "SECURITY: Only the charging_session program can call this"
      ],
      "discriminator": [
        76,
        193,
        48,
        89,
        49,
        239,
        44,
        44
      ],
      "accounts": [
        {
          "name": "voucher",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  117,
                  99,
                  104,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "voucher.buyer",
                "account": "pointsVoucher"
              },
              {
                "kind": "account",
                "path": "voucher.created_at",
                "account": "pointsVoucher"
              }
            ]
          }
        },
        {
          "name": "callerAuthority",
          "docs": [
            "The calling program signs with this PDA to prove its identity"
          ],
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "marketplace",
      "discriminator": [
        70,
        222,
        41,
        62,
        78,
        3,
        32,
        174
      ]
    },
    {
      "name": "pointsListing",
      "discriminator": [
        140,
        71,
        152,
        118,
        112,
        232,
        137,
        33
      ]
    },
    {
      "name": "pointsVoucher",
      "discriminator": [
        192,
        66,
        34,
        54,
        8,
        53,
        195,
        239
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "listingNotActive",
      "msg": "Listing is not active"
    },
    {
      "code": 6001,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6002,
      "name": "divisionByZero",
      "msg": "Division by zero"
    },
    {
      "code": 6003,
      "name": "voucherAlreadyRedeemed",
      "msg": "Voucher already redeemed"
    },
    {
      "code": 6004,
      "name": "unauthorizedCaller",
      "msg": "Unauthorized caller - only charging_session program can mark vouchers as redeemed"
    }
  ],
  "types": [
    {
      "name": "marketplace",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalPointsSold",
            "type": "u64"
          },
          {
            "name": "totalRevenueLamports",
            "type": "u64"
          },
          {
            "name": "pricePerPointLamports",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pointsListing",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "pointsAmount",
            "type": "u64"
          },
          {
            "name": "pricePerPoint",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pointsVoucher",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "pointsAmount",
            "type": "u64"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
