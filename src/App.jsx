import { useEffect, useState } from 'react'
import { loadAccount, getTokensInfo, getCurrentChainId, getTokensPrice } from './web3/web3Func'
import './styles.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faColonSign, faWallet } from '@fortawesome/free-solid-svg-icons'

import TokenList from './Components/TokensList'
import TokensPrice from './Components/TokensPrice'

function App() {
  const [curAccount, setCurAccount] = useState('')
  const [tokensInfo, setTokensInfo] = useState([])
  const [tokensPrice, setTokensPrice] = useState([])

  useEffect(()=>{
    (async ()=>{
      const account = await loadAccount()

      if (account !== null) {
        const chainId = await getCurrentChainId()
        const tokens = await getTokensInfo(chainId, account)
        const tokensPriceData = await getTokensPrice(tokens)

        tokens.map(console.log)
        tokensPriceData.map(console.log)

        setTokensInfo(tokens)
        setCurAccount(account)
        setTokensPrice(tokensPriceData)
      }
    })()
  }, [])

  return (
        <>
          <div className='wallet'>
            <FontAwesomeIcon icon={faWallet} className={curAccount ? 'wallet-on' : 'wallet-off'} />
          </div>

          {curAccount.length ? <span className='wallet-address'>Wallet Address: <span>{curAccount}</span></span> : ''}

          
          <TokenList tokens={tokensInfo} title='Balances' />
          <TokensPrice tokens={tokensPrice} />
        </>
  );
}

export default App;
