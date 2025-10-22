/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/game_engine.json`.
 */
export type GameEngine = {
  "address": "GaMeENgNEwq9D7UJt7Fzv4LptHKCBNkzxqpGMVJ7KQRK",
  "metadata": {
    "name": "gameEngine",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Game engine for recording virtual charging sessions"
  },
  "instructions": [
    {
      "name": "initializeGameEngine",
      "docs": [
        "Initialize the game engine authority PDA",
        "This creates the authority PDA that will sign CPI calls to virtual_plot"
      ],
      "discriminator": [
        101,
        20,
        30,
        179,
        90,
        99,
        223,
        118
      ],
      "accounts": [
        {
          "name": "gameEngine",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  101,
                  110,
                  103,
                  105,
                  110,
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
      "name": "recordSession",
      "docs": [
        "Record a virtual charging session on a plot via CPI",
        "This is called to record virtual sessions with revenue generated"
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
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "The payer/user who is \"charging\" virtually"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  101,
                  110,
                  103,
                  105,
                  110,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "virtualPlotProgram",
          "docs": [
            "The virtual_plot program to call via CPI"
          ],
          "address": "Ex4pz9FX9RQUHcSdb74MzTN4hpPFAHMKfqf3RtWcVHRc"
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
    }
  ],
  "accounts": [
    {
      "name": "gameEngineAuthority",
      "discriminator": [
        57,
        19,
        221,
        208,
        119,
        91,
        78,
        70
      ]
    }
  ],
  "types": [
    {
      "name": "gameEngineAuthority",
      "type": {
        "kind": "struct",
        "fields": []
      }
    }
  ]
};
