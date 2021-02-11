const hardhat = require('hardhat')
const chalk = require("chalk")

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

const { ethers, deployments, getNamedAccounts } = hardhat


const employeeAAddress = require("../deployments/fork/TreasuryVesterForEmployeeA.json").address
const employeeBAddress = require("../deployments/fork/TreasuryVesterForEmployeeB.json").address
const employeeCAddress = require("../deployments/fork/TreasuryVesterForEmployeeC.json").address
const employeeDAddress = require("../deployments/fork/TreasuryVesterForEmployeeD.json").address
const employeeLAddress = require("../deployments/fork/TreasuryVesterForEmployeeL.json").address
const employeeLiAddress = require("../deployments/fork/TreasuryVesterForEmployeeLi.json").address
const employeeJAddress = require("../deployments/fork/TreasuryVesterForEmployeeJ.json").address

const pool = require("../deployments/fork/Pool.json").address
const treasuryVesting = require("../deployments/fork/TreasuryVesterForTreasury.json").address
const merkleDistributor = require("../../merkle-distributor/deployments/fork/MerkleDistributor.json").address


async function run() {

  const gnosisSafe = await ethers.provider.getUncheckedSigner('0x029Aa20Dcc15c022b1b61D420aaCf7f179A9C73f')



  const poolToken = await ethers.getContractAt('Pool', pool, gnosisSafe)

  dim(`Disbursing to treasury...`)
  await poolToken.transfer(treasuryVesting, ethers.utils.parseEther('6000000'))

  dim(`Disbursing to merkle distributor...`)
  await poolToken.transfer(merkleDistributor, ethers.utils.parseEther('1500000'))

  dim(`Disbursing to employeeA...`)
  await poolToken.transfer(employeeAAddress, ethers.utils.parseEther('10000'))

  dim(`Disbursing to employeeB...`)
  await poolToken.transfer(employeeBAddress, ethers.utils.parseEther('400000'))

  dim(`Disbursing to employeeC...`)
  await poolToken.transfer(employeeCAddress, ethers.utils.parseEther('400000'))

  dim(`Disbursing to employeeD...`)
  await poolToken.transfer(employeeDAddress, ethers.utils.parseEther('10000'))

  dim(`Disbursing to employeeL...`)
  await poolToken.transfer(employeeLAddress, ethers.utils.parseEther('400000'))

  dim(`Disbursing to employeeLi...`)
  await poolToken.transfer(employeeLiAddress, ethers.utils.parseEther('10000'))

  dim(`Disbursing to employeeJ...`)
  await poolToken.transfer(employeeJAddress, ethers.utils.parseEther('4200'))

  green("done")
}

run()


