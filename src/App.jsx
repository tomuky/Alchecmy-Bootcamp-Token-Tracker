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

  const updateUserAddressHandler = async (addy) => {
    if(ethers.utils.isAddress(addy)) setUserAddress(addy);
    if(addy.substring(addy.length-4) !== '.eth') return;

    const alchemy = new Alchemy({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY, network: Network.ETH_MAINNET });
    const ensAddy = await alchemy.core.resolveName(addy);
    if(ethers.utils.isAddress(ensAddy)) setUserAddress(ensAddy);
  }

  const connectWallet = async () => {
    const accounts = await provider.send('eth_requestAccounts', []);
    console.log('accounts: ',accounts)
    setUserAddress(accounts[0]);
  }

  const removeWallet = () => {
    setUserAddress('');
    setHasQueried(false);
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

  const placeholderCoinImage = () => {
    return (
        <Box
            width='3vw' height='3vw' m='1vw'
            backgroundColor='white'
            borderRadius='100'
            color='black' fontWeight='bold'
            display='flex' justifyContent={'center'} alignItems={'center'}
        >
            ?
        </Box>
    )
  }

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

        { hasQueried && 
            <Button fontSize={12} onClick={removeWallet} mb={40}>
                Disconnect wallet
            </Button>
        }

        {hasQueried && (
          <SimpleGrid  columns={1} spacing={24} mb='200px'>
            {results.tokenBalances.map((e, i) => {                
                if(hasSpecialChar(tokenDataObjects[i].symbol)) return;
                if(Utils.formatUnits(
                    e.tokenBalance,
                    tokenDataObjects[i].decimals
                  )<0.0001) return;
              return (
                <Flex
                  color="white"
                  bg="#494949"
                  width="50vw"
                  key={`f_${i}`}
                  borderRadius='3px'
                >
                    { tokenDataObjects[i].logo && <Image src={tokenDataObjects[i].logo} width='3vw' m='1vw'/> }
                    { !tokenDataObjects[i].logo && placeholderCoinImage(tokenDataObjects[i].name||'')}

                    <Box display='flex' justifyContent='space-between' width='85%'>
                        <Box display='flex' alignItems='center' justifyContent='center'>
                            <b>{tokenDataObjects[i].name}</b>
                        </Box>
                        <Box display='flex' alignItems='center' justifyContent='center'>
                            { Math.round(Utils.formatUnits(e.tokenBalance,tokenDataObjects[i].decimals)*100)/100 }
                        </Box>
                    </Box>
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
