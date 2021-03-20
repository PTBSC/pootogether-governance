const networks = {}

networks.BSC = {
  saveDeployments: true,
  url: 'https://bsc-dataseed.binance.org/',
  accounts: ["841fce200a773711e9ccaa100303c22ce2d637f3f02b068deb248a7d1f777160"] //TODO change to HDWALLET_MNEMONIC environment variable
}

networks.BSC_TESTNET = {
  saveDeployments: true,
  url: 'https://data-seed-prebsc-2-s1.binance.org:8545/',
  accounts: ["841fce200a773711e9ccaa100303c22ce2d637f3f02b068deb248a7d1f777160"] //TODO change to HDWALLET_MNEMONIC environment variable
}

if (process.env.INFURA_API_KEY && process.env.HDWALLET_MNEMONIC) {
  networks.fork = {
    url: 'http://127.0.0.1:8545'
  }

  networks.kovan = {
    saveDeployments: true,
    url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.HDWALLET_MNEMONIC
    }
  }

  networks.ropsten = {
    saveDeployments: true,
    url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.HDWALLET_MNEMONIC
    }
  }

  networks.rinkeby = {
    saveDeployments: true,
    url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.HDWALLET_MNEMONIC
    }
  }

  networks.mainnet = {
    saveDeployments: true,
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: {
      mnemonic: process.env.HDWALLET_MNEMONIC
    }
  }
} else {
  console.warn('No infura or hdwallet available for testnets')
}

module.exports = networks
