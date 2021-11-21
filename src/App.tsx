import React, { ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import { randomBytes } from 'crypto'
import './App.css';
import { Bee } from '@ethersphere/bee-js';
import Wallet from 'ethereumjs-wallet';

const STAMP_ID = '6c3f24ccaae3b84206ca28776dd4c626deeeedea470f2ff400727a46f47310d9'


function App() {
    const [bee, setBee] = useState<Bee>(new Bee('http://localhost:1633'))
    const [privkey, setPrivkey] = useState<Uint8Array>(randomBytes(32))
    const [wallet, setWallet] = useState<Wallet>(new Wallet())
    const [otherEthAddress, setOtherEthAddress] = useState<string | null>(null)
    const [message, setMessage] = useState<string>('')

    async function sendButtonOnClick(bee: Bee) {
        if (!otherEthAddress) {
            console.error('nincs keyed haver')
            return
        }
        const feedWriter = bee.makeFeedWriter("sequence", new TextEncoder().encode(otherEthAddress), privkey)
        const { reference } = await bee.uploadData(STAMP_ID, new TextEncoder().encode(message))
        const result = await feedWriter.upload(STAMP_ID, reference)

        console.log('feed upload', result)
    }

    useEffect(() => {
        const windowPrivKey = window.localStorage.getItem('private_key')
        if (windowPrivKey) {
            setPrivkey(new TextEncoder().encode(windowPrivKey))
        } else {
            const key = randomBytes(32)
            window.localStorage.setItem('private_key', new TextDecoder().decode(key))
            setPrivkey(key)
            setWallet(new Wallet(key))
        }
    }, [])

    const onEthAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
        setOtherEthAddress(e.target.value)
    }

    const onMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value)
    }



    return (
        <div className="mainContainer">
            <div id="chat" className="chat">
                <div className="logo"></div>

                <div>
                    ETH Address
                <input type="text" value={otherEthAddress || ''} onChange={onEthAddressChange} />
                </div>
                <div>
                <input type="text" value={message} onChange={onMessageChange} />
                </div>


                <div className="write">
                    <input type="textarea" id="chatinput" value="" placeholder="Type a message..." />
                    <div className="sendcontainer-desktop">
                        <button onClick={() => sendButtonOnClick(bee)} className="sendButton">Send &uarr;</button>
                    </div>
                    <div className="sendcontainer">
                        <button className="sendButton">&uarr;</button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default App;



