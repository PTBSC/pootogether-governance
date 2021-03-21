require("@nomiclabs/hardhat-waffle");
require('hardhat-deploy')
require('hardhat-deploy-ethers')
require('hardhat-abi-exporter')

const networks = require('./hardhat.networks')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.5.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "istanbul"
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    MultiSig: {
      default : 0,
      56: "0xbFb05ad7A12A646938d15bFaC9B22054E2cb2F89", // BSC mainnet
      97: "0x77745e5ac1b80c84021b4ef80a33dfc0a69249d2"  // BSC testnet
    },
    MultiSigShort: {
      default : 0,
      56: "0xbFb05ad7A12A646938d15bFaC9B22054E2cb2F89", // BSC mainnet
      97: "0x77745e5ac1b80c84021b4ef80a33dfc0a69249d2"  // BSC testnet
    }
    
  },
  networks,
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  }
};
