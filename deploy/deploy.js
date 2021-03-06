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
  const oneMonthInSeconds = 109575 // 365.25 / 12*3600
  const vestingStartTimeInSeconds = parseInt(new Date().getTime() / 1000)
  const twoYearsAfterDeployStartInSeconds = vestingStartTimeInSeconds + (2 * oneYearInSeconds)
  const fourYearsAfterDeployStartInSeconds = vestingStartTimeInSeconds + (4 * oneYearInSeconds)
  const twoDaysInSeconds = 172810
  const oneHundredDaysInSeconds = 8640000 // 100 * 24 * 3600

  const onboardingAndEducationAmount = ethers.utils.parseEther("250000")
  const communityTreasury = ethers.utils.parseEther("3150000")
  
  const allReceivingEntities = {
    MultiSig: {
      amount: "1000000",
      cliff: isTestNet ? 1 : oneMonthInSeconds,
      end: isTestNet ? 15*60 : oneYearInSeconds
    },
    MultiSigShort: {
      amount: "600000",
      cliff: isTestNet ? 1 : oneMonthInSeconds,
      end: isTestNet ? 15*60 :  oneMonthInSeconds + onedayInSeconds
    }
  }
  const recentBlock = await ethers.provider.getBlock()
  dim(`got recent block timestamp: ${recentBlock.timestamp}`)
  MintingAllowedAfterInSeconds = isTestNet ? 15*60 : oneHundredDaysInSeconds

  // deploy Poo token
  dim(`deploying Poo token`)
  const poolTokenResult = await deploy('Pool', {
    args: [
      deployer, // Deployer should have 0 token at the end of the deployment
      deployer, // minter
      recentBlock.timestamp + MintingAllowedAfterInSeconds
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed PooToken token: ${poolTokenResult.address}`)

  const poolToken = await ethers.getContractAt('Pool', poolTokenResult.address, deployerSigner)

/* 
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

  // set POOL minter to timelock if not on testnet
  if(!isTestNet && await poolToken.minter() != timelockResult.address){
    dim(`Setting timelock as POO minter`)
    await poolToken.setMinter(timelockResult.address)
    green(`set POO minter as ${timelockResult.address}`)
  }

*/
  
  let tx = await poolToken.transfer(MultiSig, onboardingAndEducationAmount, {gasLimit: 20_000_000})
  green(`Transfered ${onboardingAndEducationAmount} for onboarding and education to ${MultiSig} => ${tx.hash}`)

  tx = await poolToken.transfer(MultiSig, communityTreasury)
  green(`Transfered ${communityTreasury} for onboarding and education to: ${MultiSig} => ${tx.hash}`)

  // deploy employee Treasury contracts
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
    // Transfer Amount to treasury
    await poolToken.transfer(treasuryResult.address, vestingAmount)
    green(`Transfered ${vestingAmount} for ${entity} with cliff set to ${vestingCliff}s and ${vestingEnd}s: ${treasuryResult.address}`)
  }
    
  green(`Done!`)
};
