const TokenList = ({tokens, title}) => {
   return (
      <div className="tokens-list">
         {tokens.length ? <h1 className="title">{title}</h1> : ''}

         <ul>
            {tokens.map(token=>{
               return (
                     <li key={token.name} className="">
                        <span>
                           <img src={token.logo.src} width={32} height={32} alt="wallet_img"></img>
                        </span>
                        <span className="token-name">
                           {token.name}:
                        </span>
                        <span>
                           { 'balance' in token ? token.balance : '' }
                           { 'price' in token ? token.price : '' }
                        </span>
                     </li>
                  )
            })}
         </ul>
      </div>
   ) 
}

export default TokenList