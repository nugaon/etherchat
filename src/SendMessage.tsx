import { Bee, Signer } from '@ethersphere/bee-js'
import { FormEvent, ReactElement, useState } from 'react'
import { Button, Form, FormControl, InputGroup, Spinner } from 'react-bootstrap'
import { encodeMessage, hashTopicForMessage } from './Utils'

/** Handled by the gateway proxy or swarm-extension */
const STAMP_ID = '0000000000000000000000000000000000000000000000000000000000000000'

interface Prop {
  bee: Bee
  privKey: Uint8Array | Signer
  otherEthAddress: string | null
  onSendMessage: (message: MessageFormat) => void
}
export default function SendMessage({ otherEthAddress, bee, privKey, onSendMessage }: Prop): ReactElement {
  const [message, setMessage] = useState<string>('')
  const [loadSendMessage, setLoadSendMessage] = useState<boolean>(false)

  async function sendButtonOnClick(e: FormEvent) {
    e.preventDefault()

    if (!otherEthAddress) {
      console.error('nincs keyed haver')

      return
    }

    if (!message) {
      console.error('no message')

      return
    }

    setLoadSendMessage(true)
    const hashTopic = hashTopicForMessage(otherEthAddress)
    const feedWriter = bee.makeFeedWriter('sequence', hashTopic, privKey)
    const messageFormat: MessageFormat = {
      message,
      timestamp: new Date().getTime(),
    }
    const { reference } = await bee.uploadData(STAMP_ID, encodeMessage(messageFormat.message, messageFormat.timestamp))
    console.log('uploaded swarm reference of the message', reference)
    const result = await feedWriter.upload(STAMP_ID, reference)

    console.log('feed upload', result)
    setMessage('')
    onSendMessage(messageFormat)
    setLoadSendMessage(false)
  }

  return (
    <Form onSubmit={sendButtonOnClick}>
      <InputGroup>
        <FormControl
          aria-describedby="basic-addon2"
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={loadSendMessage}
        />
        <Button disabled={loadSendMessage} variant="outline-secondary primary" id="button-addon2" type="submit">
          Send{' '}
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            variant="primary"
            hidden={!loadSendMessage}
          />
        </Button>
      </InputGroup>
    </Form>
  )
}
