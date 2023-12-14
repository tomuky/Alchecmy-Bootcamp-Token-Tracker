import {
    Box,Button,Center,Flex,Heading,Image,Input,SimpleGrid,Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useEffect, useState } from 'react';
import { hasSpecialChar } from './utility';
import { ethers } from 'ethers';

const App = () => {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [loading,setLoading] = useState(false);

  let provider;
  if(window.ethereum){
    provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  const updateUserAddressHandler = (addy) => {
    if(!ethers.utils.isAddress(addy)) return;
    setUserAddress(addy);
  }

  const connectWallet = async () => {
    const accounts = await provider.send('eth_requestAccounts', []);
    console.log('accounts: ',accounts)
    setUserAddress(accounts[0]);
  }

  useEffect(()=>{
    const getTokenBalance = async () => {
        if(loading) return;
        if(userAddress.length<1) return;
        
        setLoading(true);
        const config = {
          apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
          network: Network.ETH_MAINNET,
        };
        const alchemy = new Alchemy(config);
        const data = await alchemy.core.getTokenBalances(userAddress);
        setResults(data);
    
        const tokenDataPromises = [];
        for (let i = 0; i < data.tokenBalances.length; i++) {
          const tokenData = alchemy.core.getTokenMetadata(
            data.tokenBalances[i].contractAddress
          );
          tokenDataPromises.push(tokenData);
        }
    
        setTokenDataObjects(await Promise.all(tokenDataPromises));
        setHasQueried(true);
        setLoading(false);
      }
      getTokenBalance();
  },[userAddress]);

  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems='center'
          justifyContent="center"
          flexDirection='column'
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Get all ERC-20 tokens for an address
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        { !hasQueried && 
            <>
                <Button fontSize={20} mt={6} mb={12} >
                    { loading && 'Loading...'} 
                    { !loading && 'Check address' }
                </Button>
                <Input
                    onChange={(e) => updateUserAddressHandler(e.target.value)}
                    color="black"
                    w="600px"
                    textAlign="center"
                    p={4}
                    bgColor="white"
                    fontSize={24}
                />
                <Text>or</Text>
                <Button fontSize={20} onClick={connectWallet} mt={2} mb='100px'>
                    { loading && 'Loading...'} 
                    { !loading && 'Connect wallet' }
                </Button>
            </>
        }

        {hasQueried && <Heading my={36}>Address: {`${userAddress.substring(0,5)}...${userAddress.substring(userAddress.length-3)}`}</Heading>}

        {hasQueried && (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {                
                if(hasSpecialChar(tokenDataObjects[i].symbol)) return;
                if(Utils.formatUnits(
                    e.tokenBalance,
                    tokenDataObjects[i].decimals
                  )<0.0001) return;
              return (
                <Flex
                  flexDir='column'
                  color="white"
                  bg="#494949"
                  width="20vw"
                  key={`f_${i}`}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    { Math.round(Utils.formatUnits(e.tokenBalance,tokenDataObjects[i].decimals)*100)/100 }
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        )}
      </Flex>
    </Box>
  );
}

export default App;
