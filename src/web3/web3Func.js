import Web3 from 'web3/dist/web3.min'
import tokensData from './tokensData'
import ERC20_STANDARD_ABI from './ERC20AbiStandard'
import config from './config'

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'

export const loadAccount = async () => {
    const isLoaded = await loadWeb3()

    if (isLoaded) {
        const addressAccount = await getAccount()
        return addressAccount
    }

    return null
}

const loadWeb3 = async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum)
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
        } catch (error) {
            console.log(error)
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(Web3.currentProvider)
        Web3.eth.sendTransaction({/* ... */})
    }
    // No browser compatible...
    else {
        console.log('No metamask installed!')
        return false
    }

    return true
}

export const getCurrentChainId = async () => {
    const chainId = await window.web3.eth.getChainId()
    
    return chainId
}

const getAccount = async () => {
    const addressAccount = await window.web3.eth.getCoinbase()

    return addressAccount
}

const getTokenBalance = async (contractAddress, account, decimals=18) => {
    const tokenContract = new window.web3.eth.Contract(ERC20_STANDARD_ABI, contractAddress)
    const balance = await tokenContract.methods.balanceOf(account).call()
    const formatedBalance = balance / Math.pow(10, decimals)

    return formatedBalance
}

const getNativeBalance = async account => {
    const rawBalance = await window.web3.eth.getBalance(account)
    const formatedBalance = await window.web3.utils.fromWei(rawBalance, 'ether')

    return parseFloat(formatedBalance).toFixed(4)
}

export const getTokensInfo = async (chainId, account) => {
    const chainIdTokenData = tokensData.filter(data => {return data.chainId === chainId})

    if (chainIdTokenData.length === 0) {
        const errMsg = `no internal data to chainId ${chainId}`
        console.log(errMsg)

        return errMsg
    }

    const nativeBalance = await getNativeBalance(account)
    let tokensInfo = [
        {
            name: chainIdTokenData[0].nativeCurrency.name,
            decimals: chainIdTokenData[0].nativeCurrency.decimals,
            logo: chainIdTokenData[0].nativeCurrency.logo,
            balance: nativeBalance
        }
    ]

    const tokens = chainIdTokenData[0].tokensList

    const unresolved = tokens.map(async token=> {
        const balance = await getTokenBalance(token.address, account, token.decimals)
       
        tokensInfo.push(
            {
                name: token.name,
                address: token.address,
                balance: balance,
                logo: token.logo
            }
        )
    })
    
    await Promise.all(unresolved)

    return tokensInfo
}

const calculateAmount = async (amountIn, tokenIn, tokenOut) => {
	const abi = config.uniswap.abi
	const routerContractAddress = config.uniswap.routerContractAddress

	const uniswap = await new window.web3.eth.Contract(
		abi,
		routerContractAddress
	)

	const amounts = await uniswap.methods.getAmountsOut(
		amountIn,
		[tokenIn, tokenOut]
	).call()

	const amountResult = window.web3.utils.fromWei(amounts[1])

	return amountResult
}

const getEthereumPrice = async (ether=false) => {
	const amountIn = window.web3.utils.toWei('1', 'ether')
	const wethPrice = await calculateAmount(amountIn, WETH_ADDRESS, USDT_ADDRESS)

    if (ether) {
        return parseInt(wethPrice * Math.pow(10, 12))
    } else {
        return wethPrice
    }
}

const toFixed = (floatNumber, decimals) => {
    return parseFloat(floatNumber.toString().split('e').shift()).toFixed(decimals)
}

const getTokenPrice =  async (tokenAddress) => {
	const tokenAbi = config.token.abi

	const tokenContract = await new window.web3.eth.Contract(
		tokenAbi,
		tokenAddress
	)

	const tokenDecimals = await tokenContract.methods.decimals().call()
	const tokenAmount = '1' + '0'.repeat(tokenDecimals)

	const tokenAmountWeth = await calculateAmount(tokenAmount, tokenAddress, WETH_ADDRESS)

	const wethPrice = await getEthereumPrice()
	const curPrice = wethPrice * tokenAmountWeth

	return toFixed(curPrice, 2)
}

export const getTokensPrice = async tokens => {
    let tokensInfo = []

    const unresolved = tokens.map(async token=> {
        let price = 0

        if (token.name.toUpperCase() === 'ETH') {
            price = await getEthereumPrice(true)
        } else {
            price = await getTokenPrice(token.address)
        }
       
        tokensInfo.push(
            {
                name: token.name,
                price: price,
                logo: token.logo
            }
        )
    })
    
    await Promise.all(unresolved)

    return tokensInfo
}
