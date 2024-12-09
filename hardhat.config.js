require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: "0.8.0",
  settings: {
    evmVersion: "istanbul" // Use the EVM version compatible with your deployment environment
  },
  paths: {
    artifacts: "./frontend/src/artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337, // Specify the chainId for your local network
    },
    
  },
};
