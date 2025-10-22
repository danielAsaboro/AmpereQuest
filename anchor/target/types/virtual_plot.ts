/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/virtual_plot.json`.
 */
export type VirtualPlot = {
  "address": "Ex4pz9FX9RQUHcSdb74MzTN4hpPFAHMKfqf3RtWcVHRc",
  "metadata": {
    "name": "virtualPlot",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "installCharger",
      "docs": [
        "Install a charger on owned plot"
      ],
      "discriminator": [
        135,
        164,
        192,
        103,
        196,
        99,
        217,
        117
      ],
      "accounts": [
        {
          "name": "plot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "plot.plot_id",
                "account": "virtualPlot"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "plot"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "chargerPowerKw",
          "type": "u16"
        },
        {
          "name": "installationCost",
          "type": "u64"
        }
      ]
    },
    {
      "name": "purchasePlot",
      "docs": [
        "Purchase a virtual plot"
      ],
      "discriminator": [
        91,
        90,
        190,
        43,
        255,
        46,
        84,
        167
      ],
      "accounts": [
        {
          "name": "plot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "plotId"
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
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "plotId",
          "type": "u32"
        },
        {
          "name": "latitude",
          "type": "i32"
        },
        {
          "name": "longitude",
          "type": "i32"
        },
        {
          "name": "priceLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "recordSession",
      "docs": [
        "Record revenue from virtual charging session",
        "SECURITY: Only the game engine authority can record sessions"
      ],
      "discriminator": [
        101,
        213,
        185,
        49,
        190,
        189,
        113,
        180
      ],
      "accounts": [
        {
          "name": "plot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "plot.plot_id",
                "account": "virtualPlot"
              }
            ]
          }
        },
        {
          "name": "payer",
          "docs": [
            "Payer who uses the charging station and pays for the session"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "Only the game engine program can call this via CPI with its authority PDA"
          ],
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "revenueLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "upgradeCharger",
      "docs": [
        "Upgrade existing charger"
      ],
      "discriminator": [
        169,
        189,
        63,
        238,
        157,
        218,
        214,
        228
      ],
      "accounts": [
        {
          "name": "plot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "plot.plot_id",
                "account": "virtualPlot"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "plot"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newPowerKw",
          "type": "u16"
        },
        {
          "name": "upgradeCost",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawRevenue",
      "docs": [
        "Withdraw accumulated revenue"
      ],
      "discriminator": [
        58,
        241,
        152,
        184,
        104,
        150,
        169,
        119
      ],
      "accounts": [
        {
          "name": "plot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "plot.plot_id",
                "account": "virtualPlot"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "plot"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "virtualPlot",
      "discriminator": [
        112,
        247,
        47,
        70,
        219,
        59,
        181,
        75
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidChargerPower",
      "msg": "Invalid charger power. Must be 3, 7, 11, 22, or 30 kW"
    },
    {
      "code": 6001,
      "name": "noChargerInstalled",
      "msg": "No charger installed on this plot"
    },
    {
      "code": 6002,
      "name": "invalidUpgrade",
      "msg": "Invalid upgrade: new power must be greater than current"
    },
    {
      "code": 6003,
      "name": "plotNotOperational",
      "msg": "Plot is not operational"
    },
    {
      "code": 6004,
      "name": "insufficientRevenue",
      "msg": "Insufficient revenue to withdraw"
    },
    {
      "code": 6005,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6006,
      "name": "underflow",
      "msg": "Arithmetic underflow"
    }
  ],
  "types": [
    {
      "name": "virtualPlot",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "plotId",
            "type": "u32"
          },
          {
            "name": "latitude",
            "type": "i32"
          },
          {
            "name": "longitude",
            "type": "i32"
          },
          {
            "name": "purchasePrice",
            "type": "u64"
          },
          {
            "name": "chargerPowerKw",
            "type": "u16"
          },
          {
            "name": "totalRevenue",
            "type": "u64"
          },
          {
            "name": "totalSessions",
            "type": "u64"
          },
          {
            "name": "isOperational",
            "type": "bool"
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
