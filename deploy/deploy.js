const chalk = require('chalk');
const { getChainId } = require('hardhat');

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, deployments, ethers } = hardhat
  const { deploy } = deployments
  const namedAccounts = await getNamedAccounts()
  const { deployer, MultiSig } = await getNamedAccounts()
  const namedSigners = await ethers.getNamedSigners()
  const deployerSigner = namedSigners.deployer

  dim(`Deployer is ${deployer}`)
  const isTestNet = await getChainId() == 56 ? false : true
  dim(`Is TestNet? ${isTestNet}`)

  // constants 
  const oneYearInSeconds = 31536000
  const onedayInSeconds = 86400 // 3600*24
  const oneMonthInSeconds = 109575 // 365.25/12*3600
  const oneYearInSeconds = 36525 // 365.25 * 100
  const vestingStartTimeInSeconds = parseInt(new Date().getTime() / 1000)
  const twoYearsAfterDeployStartInSeconds = vestingStartTimeInSeconds + (2 * oneYearInSeconds)
  const fourYearsAfterDeployStartInSeconds = vestingStartTimeInSeconds + (4 * oneYearInSeconds)
  const twoDaysInSeconds = 172810
  const oneHundredDaysInSeconds = 8640000 // 100 * 24 * 3600
  
  const allReceivingEntities = {
    MultiSig: {
      amount: "1000000",
      cliff: oneMonthInSeconds,
      end: oneYearInSeconds
    },
    MultiSigShort: {
      amount: "600000",
      cliff: oneMonthInSeconds,
      end: oneMonthInSeconds + onedayInSeconds
    }
  }

  MintingAllowedAfterInSeconds = isTestNet ? 15*60 : oneHundredDaysInSeconds

  // deploy Pool token
  dim(`deploying POOL token`)
  const poolTokenResult = await deploy('Pool', {
    args: [
      MultiSig, 
      deployer, // minter
      MintingAllowedAfterInSeconds
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed PoolToken token: ${poolTokenResult.address}`)

  
  // deploy GovernorAlpha
  dim(`deploying GovernorAlpha`)
  const governanceContract = isTestNet? 'GovernorZero' : "GovernorAlpha"
  const governorResult = await deploy('GovernorAlpha', {
    contract: governanceContract,
    args: [
      deployer,
      poolTokenResult.address
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed ${governanceContract} : ${governorResult.address}`)

  // deploy Timelock
  
  const timelockContract = isTestNet? "Nolock" : "Timelock"
  dim(`deploying ${timelockContract}`)
  const timelockResult = await deploy('Timelock', {
    contract: timelockContract,
    args: [
      governorResult.address,
      isTestNet ? 1 : twoDaysInSeconds // 2 days for mainnet
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed Timelock as ${timelockContract}: ${timelockResult.address}`)

  
  dim(`Setting timelock...`)
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, deployerSigner)
  if(await governor.timelock() != timelockResult.address){
    await governor.setTimelock(timelockResult.address)
    green(`Governor Timelock set to ${timelockResult.address}`)
  }

  
  const poolToken = await ethers.getContractAt('Pool', poolTokenResult.address, deployerSigner)

  // set POOL minter to timelock if not on testnet
  if(!isTestNet && await poolToken.minter() != timelockResult.address){
    dim(`Setting timelock as POOL minter`)
    await poolToken.setMinter(timelockResult.address)
    green(`set POOL minter as ${timelockResult.address}`)
  }
  
  // deploy employee Treasury contracts
  dim(`No treasury contracts yet`)

  for(const entity in allReceivingEntities) {
    let entityAddress = namedAccounts[entity]
    if(entity == 'Treasury'){
      entityAddress = timelockResult.address
      dim("setting entity address to ", entityAddress)
    }
    const vestingAmount = ethers.utils.parseEther(allReceivingEntities[entity].amount)
    const vestingCliff = allReceivingEntities[entity].cliff
    const vestingEnd = allReceivingEntities[entity].end
    dim("deploying TreasuryVesting contract for : ", entity, "at address", entityAddress, "with ", vestingAmount, "tokens")
    const recentBlock = await ethers.provider.getBlock()
    dim(`got recent block timestamp: ${recentBlock.timestamp}`)
    const tenMinsInSeconds = 600
    const vestingStartTimeInSeconds = recentBlock.timestamp + tenMinsInSeconds 

    const treasuryResult = await deploy(`TreasuryVesterFor${entity}`, {
      contract: 'TreasuryVester',
      args: [
        poolTokenResult.address,
        entityAddress,
        vestingAmount,
        vestingStartTimeInSeconds,
        vestingStartTimeInSeconds+vestingCliff,
        vestingStartTimeInSeconds+vestingEnd
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    green(`Deployed TreasuryVesting for ${entity} at contract: ${treasuryResult.address}`)
  }
    
  green(`Done!`)
};
