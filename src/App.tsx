import { Bee, Utils } from '@ethersphere/bee-js'
import { randomBytes } from 'crypto'
import Wallet from 'ethereumjs-wallet'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Container, Form, FormControl, Stack } from 'react-bootstrap'
import './App.css'
import ListMessages from './Messages'
import SendMessage from './SendMessage'

function App() {
  // # nugaon # mollas # metacertain
  // default bee is pointing to the gateway
  const [bee, setBee] = useState<Bee>(new Bee('https://bee-9.gateway.ethswarm.org'))
  const [privkey, setPrivkey] = useState<Uint8Array>(randomBytes(32))
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [otherEthAddress, setOtherEthAddress] = useState<string | null>(null)
  const [myMessages, setMyMessages] = useState<MessageFormat[]>([])
  const [myEthAddress, setMyEthAddress] = useState<string | null>(null)

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
    }

    if (window.swarm && window.origin === 'null') {
      const beeUrl = window.swarm.web2Helper.fakeBeeApiAddress()
      setBee(new Bee(beeUrl))
      ;(async () => {
        //private key handling
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

  useEffect(() => {
    if (!wallet) return
    setMyEthAddress(wallet.getAddressString())
  }, [wallet])

  const onEthAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOtherEthAddress(e.target.value)
    setMyMessages([])
    //other's messages are set in the listMessages
  }

  return (
    <Container className="App" fluid>
      <div className="App-header">
        <h1 id="purityweb-logo" className="fadeInDown animated">
          EtherChat
        </h1>
      </div>

      <Container className="maincontent">
        <Stack gap={2}>
          <div>Your ETH address is</div>
          <div className="font-weight-bold">{myEthAddress}</div>
        </Stack>

        <hr />

        <Form.Label htmlFor="basic-url">Ethereum address of your chatpartner</Form.Label>
        <FormControl
          id="basic-url"
          aria-describedby="basic-addon3"
          value={otherEthAddress || ''}
          onChange={onEthAddressChange}
        />

        <hr />

        <ListMessages
          bee={bee}
          myEthAddress={myEthAddress}
          othersEthAddress={otherEthAddress}
          myMessages={myMessages}
          setMyMessages={setMyMessages}
        />

        <hr />

        <SendMessage
          bee={bee}
          otherEthAddress={otherEthAddress}
          privKey={privkey}
          onSendMessage={message => setMyMessages([...myMessages, message])}
        />
      </Container>
    </Container>
  )
}

export default App
