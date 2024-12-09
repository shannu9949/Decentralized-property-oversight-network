import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Input,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import RealEstate from './artifacts/contracts/Real_estate.sol/RealEstate.json';
const { ethers } = require('ethers');

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [lands, setLands] = useState([]);
  const [rightHolders, setRightHolders] = useState('');
  const [price, setPrice] = useState('');
  const [documentNo, setDocumentNo] = useState('');
  const [purchaseDocumentNo, setPurchaseDocumentNo] = useState('');
  const [claimants, setClaimants] = useState('');
  const [approvalStatus, setApprovalStatus] = useState({}); // Object to store approval status for each document number
  const toast = useToast();

  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Ensure this address is correct

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      window.ethereum.on('accountsChanged', accounts => {
        if (accounts.length === 0) {
          setAccount(null);
          setLands([]);
        } else {
          setAccount(accounts[0]);
          setSigner(provider.getSigner());
        }
      });

      window.ethereum.on('disconnect', () => {
        setAccount(null);
        setLands([]);
      });
    }
  }, []);

  useEffect(() => {
    if (account) {
      getLands();
    }
  }, [account]);

  const fetchApprovalStatus = async docNo => {
    if (!provider || !signer) {
      console.error('Provider or signer not found');
      return;
    }

    try {
      const status = await purachaseProposal(docNo);
      setApprovalStatus(prevState => ({
        ...prevState,
        [docNo]: status, // Store the status with the document number as key
      }));
    } catch (error) {
      console.error('Error retrieving approval status:', error);
    }
  };

  useEffect(() => {
    // Fetch approval status for each land when lands are fetched
    lands.forEach(land => {
      fetchApprovalStatus(land.document_no);
    });
  }, [lands]);

  const purachaseProposal = async doc_no => {
    if (!provider || !signer) {
      console.error('Provider or signer not found');
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddress,
        RealEstate.abi,
        signer
      );
      const approval = await contract.purchaseProposals(doc_no);
      return approval.active;
    } catch (error) {
      console.error('Error retrieving data:', error);
    }
  };

  const getLands = async () => {
    if (!provider || !signer) {
      console.error('Provider or signer not found');
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        RealEstate.abi,
        signer
      );
      const landsData = await contract.retrieve();

      const formattedLands = landsData.map(land => ({
        right_holders: land.right_holders,
        price: ethers.utils.formatEther(land.price),
        document_no: land.document_no.toString(),
        yearOfRegistration: land.yearOfRegistration.toString(),
      }));
      console.log(landsData);

      setLands(formattedLands);
     
    } catch (error) {
      setLands([]);
      console.error('Error retrieving data:', error);
     
    }
  };

  const getAccounts = async () => {
    if (!provider) {
      console.error('Provider not found');
      return;
    }

    try {
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
      toast({
        title: 'Connected to MetaMask',
        description: `Connected account: ${accounts[0]}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      getLands();
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
      toast({
        title: 'Error connecting to MetaMask',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const registerLand = async () => {
    if (!provider || !signer) {
      console.error('Provider or signer not found');
      return;
    }

    if (!rightHolders || !price || !documentNo) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        RealEstate.abi,
        signer
      );
      const rightHoldersArray = rightHolders
        .split(',')
        .map(holder => holder.trim());

      rightHoldersArray.forEach(address => {
        if (!ethers.utils.isAddress(address)) {
          throw new Error(`Invalid address: ${address}`);
        }
      });

      const priceInWei = ethers.utils.parseEther(price);

      const tx = await contract.register(
        rightHoldersArray,
        priceInWei,
        documentNo
      );
      await tx.wait();

      const newLand = {
        right_holders: rightHoldersArray,
        price: ethers.utils.formatEther(priceInWei),
        document_no: documentNo,
        yearOfRegistration: new Date().getFullYear().toString(),
      };

      setLands([...lands, newLand]);
      setRightHolders('');
      setPrice('');
      setDocumentNo('');

      toast({
        title: 'Land registered successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error registering land:', error);
      toast({
        title: 'Error registering land.',
        description: 'Sorry',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const approvePurchase = async doc_no => {
    if (!provider || !signer) {
      console.error('Provider or signer not found');
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddress,
        RealEstate.abi,
        signer
      );
      const approve = await contract.approvePurchase(doc_no);
      if (approve) {
        setLands(prevLands =>
          prevLands.filter(land => land.document_no !== doc_no)
        );
      }
    } catch (error) {
      console.error('Error approving purchase:', error);
    }
  };

  const purchaseLand = async () => {
    if (!provider || !signer) {
      console.error('Provider or signer not found');
      return;
    }

    // Validate the input fields
    if (!purchaseDocumentNo || !claimants) {
      toast({
        title: 'Validation Error',
        description: 'Both fields are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        RealEstate.abi,
        signer
      );
      const claimantsArray = claimants
        .split(',')
        .map(claimant => claimant.trim());

      const tx = await contract.Purchase(purchaseDocumentNo, claimantsArray);
      await tx.wait();

      // Clear input fields
      setPurchaseDocumentNo('');
      setClaimants('');

      // Refresh lands list
      getLands();

      toast({
        title: 'Land purchase initiated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error purchasing land:', error);
      if (error.code === -32603) {
        toast({
          title: 'Internal JSON-RPC Error',
          description:
            'An internal JSON-RPC error occurred. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error purchasing land.',
          description:
            'The registrant cannot call this function' ||
            'An error occurred while purchasing land.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const shortenAddress = address => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box w="100%" p={4}>
      <Box display="flex" justifyContent="flex-end" gap="4">
        <Button fontSize="100%" bg="orange.400" size="md" onClick={getAccounts}>
          {account ? shortenAddress(account) : 'Connect Wallet'}
        </Button>
        <ColorModeSwitcher />
      </Box>

      <VStack spacing={4} align="stretch" mt={4}>
        <Text fontSize="xl" fontWeight="bold">
          Register a New Land
        </Text>
        <Input
          placeholder="Right Holders (comma separated)"
          value={rightHolders}
          onChange={e => setRightHolders(e.target.value)}
        />
        <Input
          placeholder="Price (in ETH)"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <Input
          placeholder="Document Number"
          value={documentNo}
          onChange={e => setDocumentNo(e.target.value)}
        />
        <Button colorScheme="teal" onClick={registerLand}>
          Register Land
        </Button>
      </VStack>

      <VStack spacing={4} align="stretch" mt={50}>
        <Text fontSize="xl" fontWeight="bold">
          Purchase Land
        </Text>
        <Input
          placeholder="Document Number"
          value={purchaseDocumentNo}
          onChange={e => setPurchaseDocumentNo(e.target.value)}
        />
        <Input
          placeholder="Claimants (comma separated)"
          value={claimants}
          onChange={e => setClaimants(e.target.value)}
        />
        <Button colorScheme="teal" onClick={purchaseLand}>
          Purchase Land
        </Button>
      </VStack>
      {account && (
        <VStack spacing={4} align="stretch" mt={8}>
          <Text fontSize="xl" fontWeight="bold" color="tomato" as="i">
            {lands.length > 0
              ? 'HERE ARE YOUR OWNED LANDS'
              : "YOU DON'T HAVE ANY LANDS"}
          </Text>

          {lands.length > 0 ? (
            lands.map((land, index) => (
              <Box key={index} p={4} shadow="md" borderWidth="1px">
                <Text>
                  <b>Document No:</b> {land.document_no}
                </Text>
                <Text>
                  <b>Price:</b> {land.price} ETH
                </Text>
                <Text>
                  <b>Year of Registration:</b> {land.yearOfRegistration}
                </Text>
                <Text>
                  <b>Right Holders:</b> {land.right_holders.join(', ')}
                </Text>
                {approvalStatus[land.document_no] && (
                  <Button
                    size = "sm"
                    colorScheme="orange"
                    mt={4}
                    onClick={() => approvePurchase(land.document_no)}
                  >
                    Approve Purchase
                  </Button>
                )}
              </Box>
            ))
          ) : (
            <Text>No lands registered</Text>
          )}
        </VStack>
      )}
    </Box>
  );
}

export default App;
