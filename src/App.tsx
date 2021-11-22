import { Bee, Utils } from '@ethersphere/bee-js'
import { randomBytes } from 'crypto'
import Wallet from 'ethereumjs-wallet'
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Button, Container, Form, FormControl, InputGroup, Stack } from 'react-bootstrap'
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

  async function sendButtonOnClick(e: FormEvent) {
    e.preventDefault()

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
    setMessage('')
  }

  async function refreshOthersMessage() {
    console.log('other eth address', otherEthAddress)

    if (!otherEthAddress || otherEthAddress.length === 0) {
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

    if (window.swarm && !window.origin) {
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

        <div className="read">
          <div>
            last message from your bro: "{lastOtherMessage}" <br />
            <Button onClick={refreshOthersMessage} className="refreshButton">
              Refresh
            </Button>
          </div>
        </div>

        <hr />

        <Form onSubmit={sendButtonOnClick}>
          <InputGroup>
            <FormControl aria-describedby="basic-addon2" value={message} onChange={onMessageChange} />
            <Button variant="outline-secondary primary" id="button-addon2" type="submit">
              Send
            </Button>
          </InputGroup>
        </Form>
      </Container>
    </Container>
  )
}

export default App
