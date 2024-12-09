import Real_estate from './artifacts/contracts/Real_estate.sol/RealEstate';
const {ethers} = require("ethers");
export default async function deploy(signer) {
  const factory = new ethers.ContractFactory(Real_estate.abi,Real_estate.bytecode,signer);
  const contract =  await factory.deploy();
  
  return contract;
 
}

