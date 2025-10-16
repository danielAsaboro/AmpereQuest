/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/charging_session.json`.
 */
export type ChargingSession = {
  "address": "5emVuARWebNveyqe9ivrM24yhBMdLWJvq3qzYTDDd66u",
  "metadata": {
    "name": "chargingSession",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "creditPoints",
      "docs": [
        "Credit points to user (callable via CPI by authorized programs like marketplace)",
        "SECURITY: Only authorized programs can call this to prevent arbitrary point minting"
      ],
      "discriminator": [
        140,
        43,
        121,
        246,
        176,
        80,
        167,
        176
      ],
      "accounts": [
        {
          "name": "userAccount",
          "writable": true
        },
        {
          "name": "callerAuthority",
          "docs": [
            "The calling program signs with this PDA to prove its identity"
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "debitPoints",
      "docs": [
        "Debit points from user (callable via CPI by authorized programs like marketplace)",
        "SECURITY: Only authorized programs can call this to prevent unauthorized point burning"
      ],
      "discriminator": [
        15,
        153,
        89,
        226,
        157,
        112,
        126,
        126
      ],
      "accounts": [
        {
          "name": "userAccount",
          "writable": true
        },
        {
          "name": "callerAuthority",
          "docs": [
            "The calling program signs with this PDA to prove its identity"
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "endSession",
      "docs": [
        "End charging session and mint points to user"
      ],
      "discriminator": [
        11,
        244,
        61,
        154,
        212,
        249,
        15,
        66
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.user",
                "account": "chargingSession"
              },
              {
                "kind": "account",
                "path": "session.start_time",
                "account": "chargingSession"
              },
              {
                "kind": "account",
                "path": "session.nonce",
                "account": "chargingSession"
              }
            ]
          }
        },
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true,
          "relations": [
            "session"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeUser",
      "docs": [
        "Initialize user account"
      ],
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
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
      "name": "redeemVoucher",
      "docs": [
        "Redeem a voucher from the marketplace",
        "Creates a redemption record to prevent double-spending",
        "SECURITY: Uses init constraint on redemption_record to prevent double redemption",
        "The init will fail if a redemption record already exists for this voucher"
      ],
      "discriminator": [
        50,
        219,
        8,
        127,
        45,
        96,
        161,
        92
      ],
      "accounts": [
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "redemptionRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  100,
                  101,
                  109,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "voucher"
              }
            ]
          }
        },
        {
          "name": "voucher"
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
      "name": "startSession",
      "docs": [
        "Initialize a new charging session",
        "Uses timestamp + nonce to prevent PDA collisions if multiple sessions start in same second"
      ],
      "discriminator": [
        23,
        227,
        111,
        142,
        212,
        230,
        3,
        175
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "timestamp"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "user",
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
          "name": "chargerCode",
          "type": "string"
        },
        {
          "name": "chargerPowerKw",
          "type": "u16"
        },
        {
          "name": "pricingPerKwh",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        },
        {
          "name": "nonce",
          "type": "u32"
        }
      ]
    },
    {
      "name": "updateSession",
      "docs": [
        "Update session with energy consumed (called periodically during charging)"
      ],
      "discriminator": [
        173,
        25,
        235,
        79,
        40,
        217,
        155,
        103
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.user",
                "account": "chargingSession"
              },
              {
                "kind": "account",
                "path": "session.start_time",
                "account": "chargingSession"
              },
              {
                "kind": "account",
                "path": "session.nonce",
                "account": "chargingSession"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "relations": [
            "session"
          ]
        }
      ],
      "args": [
        {
          "name": "energyWhIncrement",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "chargingSession",
      "discriminator": [
        167,
        37,
        9,
        198,
        108,
        160,
        43,
        64
      ]
    },
    {
      "name": "userAccount",
      "discriminator": [
        211,
        33,
        136,
        16,
        186,
        110,
        242,
        127
      ]
    },
    {
      "name": "voucherRedemption",
      "discriminator": [
        158,
        68,
        58,
        94,
        170,
        144,
        102,
        66
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "sessionNotActive",
      "msg": "Session is not active"
    },
    {
      "code": 6001,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6002,
      "name": "insufficientPoints",
      "msg": "Insufficient points"
    },
    {
      "code": 6003,
      "name": "underflow",
      "msg": "Arithmetic underflow"
    },
    {
      "code": 6004,
      "name": "invalidVoucherProgram",
      "msg": "Invalid voucher program"
    },
    {
      "code": 6005,
      "name": "invalidVoucherData",
      "msg": "Invalid voucher data"
    },
    {
      "code": 6006,
      "name": "unauthorizedVoucher",
      "msg": "Unauthorized voucher"
    },
    {
      "code": 6007,
      "name": "voucherAlreadyRedeemed",
      "msg": "Voucher already redeemed"
    },
    {
      "code": 6008,
      "name": "unauthorizedCaller",
      "msg": "Unauthorized caller - only whitelisted programs can modify points"
    }
  ],
  "types": [
    {
      "name": "chargingSession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "chargerCode",
            "type": "string"
          },
          {
            "name": "chargerPowerKw",
            "type": "u16"
          },
          {
            "name": "pricingPerKwh",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "nonce",
            "type": "u32"
          },
          {
            "name": "endTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "energyConsumedWh",
            "type": "u64"
          },
          {
            "name": "pointsEarned",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalPoints",
            "type": "u64"
          },
          {
            "name": "availablePoints",
            "type": "u64"
          },
          {
            "name": "totalEnergyKwh",
            "type": "u64"
          },
          {
            "name": "totalSessions",
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
      "name": "voucherRedemption",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voucher",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "pointsAmount",
            "type": "u64"
          },
          {
            "name": "redeemedAt",
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
