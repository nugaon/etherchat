import { Bee, Utils } from '@ethersphere/bee-js'
import { randomBytes } from 'crypto'
import Wallet from 'ethereumjs-wallet'
import React, { ChangeEvent, useEffect, useState } from 'react'
import './App.css'

/** Handled by the gateway proxy or swarm-extension */
const STAMP_ID = '0000000000000000000000000000000000000000000000000000000000000000'

function App() {
  // # nugaon # mollas # metacertain
  // default bee is pointing to the gateway
  const [bee, setBee] = useState<Bee>(new Bee('https://bee-9.gateway.ethswarm.org'))
  const [privkey, setPrivkey] = useState<Uint8Array>(randomBytes(32))
  const [wallet, setWallet] = useState<Wallet>(new Wallet())
  const [otherEthAddress, setOtherEthAddress] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [lastOtherMessage, setLastOtherMessage] = useState<string>('')
  const [myEthAddress, setMyEthAddress] = useState<string>('')

  async function sendButtonOnClick() {
    if (!otherEthAddress) {
      console.error('nincs keyed haver')

      return
    }
    console.log('other eth address', otherEthAddress)
    const hashTopic = Utils.keccak256Hash(Utils.hexToBytes(otherEthAddress))
    const feedWriter = bee.makeFeedWriter('sequence', hashTopic, privkey)
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
    const feedReader = bee.makeFeedReader('sequence', hashTopic, otherEthAddress)
    const latest = await feedReader.download()

    console.log('latest', latest)
    const bytes = await bee.downloadData(latest.reference)
    setLastOtherMessage(new TextDecoder().decode(bytes))
  }

  // constructor
  useEffect(() => {
    const setStringKey = (key: string) => {
      const keyBytes = Utils.hexToBytes(key)
      setByteKey(keyBytes)
    }

    /** bytes represent hex keys */
    const setByteKey = (keyBytes: Uint8Array) => {
      setPrivkey(keyBytes)
      const wallet = new Wallet(Buffer.from(keyBytes))
      setWallet(wallet)
      setMyEthAddress(Utils.bytesToHex(wallet.getAddress()))
    }

    if (window.swarm && window.location.pathname.includes('/bzz/')) {
      const beeUrl = window.swarm.web2Helper.fakeBeeApiAddress()
      setBee(new Bee(beeUrl))
      ;(async () => {
        const windowPrivKey = await window.swarm.localStorage.getItem('private_key')

        if (windowPrivKey) {
          setStringKey(windowPrivKey)
        } else {
          const key = randomBytes(32)
          await window.swarm.localStorage.setItem('private_key', Utils.bytesToHex(key))
          setByteKey(key)
        }
      })()
    } else {
      const windowPrivKey = window.localStorage.getItem('private_key')

      if (windowPrivKey) {
        setStringKey(windowPrivKey)
      } else {
        const key = randomBytes(32)
        window.localStorage.setItem('private_key', Utils.bytesToHex(key))
        setByteKey(key)
      }
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
          Your ETH address is <b>{myEthAddress}</b>
        </div>

        <div>
          ETH Address
          <input type="text" value={otherEthAddress || ''} onChange={onEthAddressChange} />
        </div>
        <div>
          <input type="text" value={message} onChange={onMessageChange} />
        </div>

        <div className="write">
          <div className="sendcontainer-desktop">
            <button onClick={sendButtonOnClick} className="sendButton">
              Send &uarr;
            </button>
          </div>
        </div>
        <div className="read">
          <div>
            last message from your bro: "{lastOtherMessage}" <br />
            <button onClick={refreshButton} className="refreshButton">
              Load
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
