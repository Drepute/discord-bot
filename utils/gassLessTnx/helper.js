const { ethers } = require("ethers");
const fetch = require("node-fetch");
const abi = require("ethereumjs-abi");
const pocpAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ApproverAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ApproverRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint8",
        name: "level",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "category",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Claim",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "memberTokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "_type",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Issue",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "level",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "category",
        type: "uint8",
      },
    ],
    name: "MembershipTokenChange",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "NameChange",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Revoke",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint8",
        name: "level",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "category",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Upgrade",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "uriString",
        type: "string",
      },
    ],
    name: "_stringToArray",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "addApprover",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "memberTokenIds",
        type: "uint256[]",
      },
      {
        internalType: "uint8[]",
        name: "type_",
        type: "uint8[]",
      },
      {
        internalType: "uint256[]",
        name: "data",
        type: "uint256[]",
      },
      {
        internalType: "string",
        name: "tokenUri",
        type: "string",
      },
    ],
    name: "batchIssueBadge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "approverToAdd",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "approversToRemove",
        type: "address[]",
      },
    ],
    name: "changeApprover",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint32",
            name: "index",
            type: "uint32",
          },
          {
            internalType: "uint256[]",
            name: "memberTokenIds",
            type: "uint256[]",
          },
          {
            internalType: "uint8[]",
            name: "type_",
            type: "uint8[]",
          },
          {
            internalType: "string",
            name: "tokenUri",
            type: "string",
          },
          {
            internalType: "uint256[]",
            name: "data",
            type: "uint256[]",
          },
          {
            internalType: "uint32[]",
            name: "nonces",
            type: "uint32[]",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct IREP3TokenTypes.BadgeVoucher",
        name: "voucher",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "memberTokenId",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "approvedIndex",
        type: "uint256[]",
      },
    ],
    name: "claimBadge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256[]",
            name: "data",
            type: "uint256[]",
          },
          {
            internalType: "uint8[]",
            name: "end",
            type: "uint8[]",
          },
          {
            internalType: "address[]",
            name: "to",
            type: "address[]",
          },
          {
            internalType: "string",
            name: "tokenUris",
            type: "string",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct IREP3TokenTypes.NFTVoucher",
        name: "voucher",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "approvedIndex",
        type: "uint256",
      },
    ],
    name: "claimMembership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "slot",
        type: "uint8",
      },
    ],
    name: "dataSlot",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getType",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "memberTokenId",
        type: "uint256",
      },
    ],
    name: "getVoucherNonce",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
      {
        internalType: "address[]",
        name: "_approvers",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "trustedForwarder_",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "isApprover",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "forwarder",
        type: "address",
      },
    ],
    name: "isTrustedForwarder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "memberTokenId",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "type_",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "data",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "tokenUri",
        type: "string",
      },
    ],
    name: "issueBadge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "to",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "data",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "tokenUri",
        type: "string",
      },
    ],
    name: "issueMembership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "tokenUri",
        type: "string",
      },
    ],
    name: "membershipURIChange",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "migrate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "removeApprover",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "revokeMembership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct IREP3TokenTypes.TransferVoucher",
        name: "voucher",
        type: "tuple",
      },
    ],
    name: "soulTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "data",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "tokenUri",
        type: "string",
      },
    ],
    name: "updateMembership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const routerAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "manager_",
        type: "address",
      },
      {
        internalType: "address",
        name: "_trustedForwarder",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "FunctionRouted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "forwarder",
        type: "address",
      },
    ],
    name: "isTrustedForwarder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct Router.ForwardRequest",
        name: "req",
        type: "tuple",
      },
    ],
    name: "routeRequest",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "trustedForwarder",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "versionRecipient",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];
let helperAttributes = {};
let supportedNetworks = [80001]; //add more
helperAttributes.ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
helperAttributes.baseURL = "https://api.biconomy.io";
// any other constants needed goes in helperAttributes

helperAttributes.biconomyForwarderAbi = [
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "domainSeparator",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "domainValue",
        type: "bytes",
      },
    ],
    name: "DomainRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "EIP712_DOMAIN_TYPE",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "REQUEST_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "domains",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "txGas", type: "uint256" },
          { internalType: "uint256", name: "tokenGasPrice", type: "uint256" },
          { internalType: "uint256", name: "batchId", type: "uint256" },
          { internalType: "uint256", name: "batchNonce", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "structERC20ForwardRequestTypes.ERC20ForwardRequest",
        name: "req",
        type: "tuple",
      },
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" },
      { internalType: "bytes", name: "sig", type: "bytes" },
    ],
    name: "executeEIP712",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" },
      { internalType: "bytes", name: "ret", type: "bytes" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "txGas", type: "uint256" },
          { internalType: "uint256", name: "tokenGasPrice", type: "uint256" },
          { internalType: "uint256", name: "batchId", type: "uint256" },
          { internalType: "uint256", name: "batchNonce", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "structERC20ForwardRequestTypes.ERC20ForwardRequest",
        name: "req",
        type: "tuple",
      },
      { internalType: "bytes", name: "sig", type: "bytes" },
    ],
    name: "executePersonalSign",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" },
      { internalType: "bytes", name: "ret", type: "bytes" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "batchId", type: "uint256" },
    ],
    name: "getNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isOwner",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "version", type: "string" },
    ],
    name: "registerDomainSeparator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "txGas", type: "uint256" },
          { internalType: "uint256", name: "tokenGasPrice", type: "uint256" },
          { internalType: "uint256", name: "batchId", type: "uint256" },
          { internalType: "uint256", name: "batchNonce", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "structERC20ForwardRequestTypes.ERC20ForwardRequest",
        name: "req",
        type: "tuple",
      },
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" },
      { internalType: "bytes", name: "sig", type: "bytes" },
    ],
    name: "verifyEIP712",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "txGas", type: "uint256" },
          { internalType: "uint256", name: "tokenGasPrice", type: "uint256" },
          { internalType: "uint256", name: "batchId", type: "uint256" },
          { internalType: "uint256", name: "batchNonce", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "structERC20ForwardRequestTypes.ERC20ForwardRequest",
        name: "req",
        type: "tuple",
      },
      { internalType: "bytes", name: "sig", type: "bytes" },
    ],
    name: "verifyPersonalSign",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
];

helperAttributes.biconomyForwarderDomainData = {
  name: "Biconomy Forwarder",
  version: "1",
};

helperAttributes.domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "verifyingContract", type: "address" },
  { name: "salt", type: "bytes32" },
];

helperAttributes.forwardRequestType = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "token", type: "address" },
  { name: "txGas", type: "uint256" },
  { name: "tokenGasPrice", type: "uint256" },
  { name: "batchId", type: "uint256" },
  { name: "batchNonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
  { name: "data", type: "bytes" },
];

// pass the networkId to get contract addresses
const getContractAddresses = async (networkId) => {
  let contractAddresses = {};
  const apiInfo = `${helperAttributes.baseURL}/api/v2/meta-tx/systemInfo?networkId=${networkId}`;
  const response = await fetch(apiInfo);
  const systemInfo = await response.json();

  contractAddresses.biconomyForwarderAddress =
    systemInfo.biconomyForwarderAddress;
  console.log(
    "Response JSON " + JSON.stringify(systemInfo),
    systemInfo.biconomyForwarderAddress,
    contractAddresses
  );
  return contractAddresses;
};

/**
 * Returns ABI and contract address based on network Id
 * You can build biconomy forwarder contract object using above values and calculate the nonce
 * @param {*} networkId
 */
const getBiconomyForwarderConfig = async (networkId) => {
  //get trusted forwarder contract address from network id
  const contractAddresses = await getContractAddresses(networkId);
  console.log("contracts", contractAddresses);
  const forwarderAddress = contractAddresses.biconomyForwarderAddress;
  console.log("contracts", contractAddresses, forwarderAddress);
  return {
    abi: helperAttributes.biconomyForwarderAbi,
    address: forwarderAddress,
  };
};

/**
 * pass the below params in any order e.g. account=<account>,batchNone=<batchNone>,...
 * @param {*}  account - from (end user's) address for this transaction
 * @param {*}  to - target recipient contract address
 * @param {*}  gasLimitNum - gas estimation of your target method in numeric format
 * @param {*}  batchId - batchId
 * @param {*}  batchNonce - batchNonce which can be verified and obtained from the biconomy forwarder
 * @param {*}  data - functionSignature of target method
 * @param {*}  deadline - optional deadline for this forward request
 */
const buildForwardTxRequest = async ({
  account,
  to,
  gasLimitNum,
  batchId,
  batchNonce,
  data,
  deadline,
}) => {
  const req = {
    from: account,
    to: to,
    token: helperAttributes.ZERO_ADDRESS,
    txGas: gasLimitNum,
    tokenGasPrice: "0",
    batchId: parseInt(batchId),
    batchNonce: parseInt(batchNonce),
    deadline: deadline || Math.floor(Date.now() / 1000 + 3600),
    data: data,
  };
  return req;
};

/**
 * pass your forward request and network Id
 * use this method to build message to be signed by end user in EIP712 signature format
 * @param {*} request - forward request object
 * @param {*} networkId
 */
const getDataToSignForEIP712 = async (request, networkId) => {
  const contractAddresses = await getContractAddresses(networkId);
  const forwarderAddress = contractAddresses.biconomyForwarderAddress;
  let domainData = helperAttributes.biconomyForwarderDomainData;
  domainData.salt = ethers.utils.hexZeroPad(
    ethers.BigNumber.from(networkId).toHexString(),
    32
  );
  domainData.verifyingContract = forwarderAddress;

  const dataToSign = JSON.stringify({
    types: {
      EIP712Domain: helperAttributes.domainType,
      ERC20ForwardRequest: helperAttributes.forwardRequestType,
    },
    domain: domainData,
    primaryType: "ERC20ForwardRequest",
    message: request,
  });
  return dataToSign;
};

/**
 * pass your forward request
 * use this method to build message to be signed by end user in personal signature format
 * @param {*} networkId
 */
const getDataToSignForPersonalSign = (request) => {
  const hashToSign = abi.soliditySHA3(
    [
      "address",
      "address",
      "address",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      request.from,
      request.to,
      request.token,
      request.txGas,
      request.tokenGasPrice,
      request.batchId,
      request.batchNonce,
      request.deadline,
      ethers.utils.keccak256(request.data),
    ]
  );
  return hashToSign;
};

/**
 * get the domain seperator that needs to be passed while using EIP712 signature type
 * @param {*} networkId
 */
const getDomainSeperator = async (networkId) => {
  const contractAddresses = await getContractAddresses(networkId);
  const forwarderAddress = contractAddresses.biconomyForwarderAddress;
  let domainData = helperAttributes.biconomyForwarderDomainData;
  domainData.salt = ethers.utils.hexZeroPad(
    ethers.BigNumber.from(networkId).toHexString(),
    32
  );
  domainData.verifyingContract = forwarderAddress;

  const domainSeparator = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32", "bytes32", "address", "bytes32"],
      [
        ethers.utils.id(
          "EIP712Domain(string name,string version,address verifyingContract,bytes32 salt)"
        ),
        ethers.utils.id(domainData.name),
        ethers.utils.id(domainData.version),
        domainData.verifyingContract,
        domainData.salt,
      ]
    )
  );
  return domainSeparator;
};

const getTransactionReceiptMined = async (web3, txHash, interval) => {
  const transactionReceiptAsync = async function (resolve, reject) {
    var receipt = await web3.eth.getTransactionReceipt(txHash);
    if (receipt == null) {
      setTimeout(
        () => transactionReceiptAsync(resolve, reject),
        interval ? interval : 500
      );
    } else {
      resolve(receipt);
    }
  };

  if (typeof txHash === "string") {
    return new Promise(transactionReceiptAsync);
  } else {
    throw new Error("Invalid Type: " + txHash);
  }
};

module.exports = {
  helperAttributes,
  getDomainSeperator,
  getDataToSignForPersonalSign,
  getDataToSignForEIP712,
  buildForwardTxRequest,
  getBiconomyForwarderConfig,
  routerAbi,
  pocpAbi,
  getTransactionReceiptMined,
};
