import React, { ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react';
import logo from './logo.svg';
import { randomBytes } from 'crypto'
import './App.css';
import { Bee, Utils } from '@ethersphere/bee-js';
import Wallet from 'ethereumjs-wallet';

const STAMP_ID = '6c3f24ccaae3b84206ca28776dd4c626deeeedea470f2ff400727a46f47310d9'


function App() {
    // # nugaon # mollas # metacertain
    const [bee, setBee] = useState<Bee>(new Bee('http://localhost:1633'))
    const [privkey, setPrivkey] = useState<Uint8Array>(randomBytes(32))
    const [wallet, setWallet] = useState<Wallet>(new Wallet())
    const [otherEthAddress, setOtherEthAddress] = useState<string | null>(null)
    const [message, setMessage] = useState<string>('')
    const [lastOtherMessage, setLastOtherMessage] = useState<string>('')

    async function sendButtonOnClick(bee: Bee) {
        if (!otherEthAddress) {
            console.error('nincs keyed haver')
            return
        }
        console.log('other eth address', otherEthAddress)
        const hashTopic = Utils.keccak256Hash(Utils.hexToBytes(otherEthAddress))
        const feedWriter = bee.makeFeedWriter("sequence", hashTopic, privkey)
        console.log('hash topic', Utils.bytesToHex(hashTopic))
        const { reference } = await bee.uploadData(STAMP_ID, new TextEncoder().encode(message))
        console.log('uploaded swarm reference', reference)
        const result = await feedWriter.upload(STAMP_ID, reference)

        console.log('feed upload', result)
    }

    async function refreshButton() {
        if (!otherEthAddress) {
            console.error('nincs keyed haver')
            return
        }
        console.log('myethaddress wallet', wallet)
        const myEthAddress = wallet.getAddress()
        const hashTopic = Utils.keccak256Hash(myEthAddress)
        console.log('hastopic', Utils.bytesToHex(hashTopic))
        const feedReader = bee.makeFeedReader("sequence", hashTopic, otherEthAddress)
        const latest = await feedReader.download()

        console.log('latest', latest)
        const bytes = await bee.downloadData(latest.reference)
        setLastOtherMessage(new TextDecoder().decode(bytes))
    }  

    useEffect(() => {
        const windowPrivKey = window.localStorage.getItem('private_key')
        if (windowPrivKey) {
            const privKeyBytes = Utils.hexToBytes(windowPrivKey)
            setPrivkey(privKeyBytes)
            setWallet(new Wallet(Buffer.from(privKeyBytes)))
        } else {
            const key = randomBytes(32)
            window.localStorage.setItem('private_key', Utils.bytesToHex(key))
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
                    <div className="sendcontainer-desktop">
                        <button onClick={() => sendButtonOnClick(bee)} className="sendButton">Send &uarr;</button>
                    </div>
                </div>
                <div className="read">
                    <div>
                        last message from your bro: "{lastOtherMessage}" <br/>
                    <button onClick={refreshButton} className="refreshButton">load;</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;



