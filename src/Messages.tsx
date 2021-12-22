import { Bee, Utils } from '@ethersphere/bee-js'
import { ReactElement, useEffect, useState } from 'react'
import { Button, Col, Row, Spinner } from 'react-bootstrap'
import { decodeMessage, fetchIndexToInt, hashTopicForMessage, previousIdentifiers, saveLocalStorage } from './Utils'

interface Props {
  bee: Bee
  myEthAddress: string | null
  othersEthAddress: string | null
  myMessages: MessageFormat[]
  setMyMessages: (value: MessageFormat[]) => void
}

export default function ListMessages({
  bee,
  myEthAddress,
  othersEthAddress,
  myMessages,
  setMyMessages,
}: Props): ReactElement {
  const [listMessages, setListMessages] = useState<MessageBoxProps[]>([])
  const [loadListMessages, setLoadListMessages] = useState<boolean>(false)
  const [otherMessages, setOtherMessages] = useState<MessageFormat[]>([])
  let otherLastFetchIndex = 0
  let mineLastFetchIndex = 0

  // constructor
  useEffect(() => {
    if (window.swarm && window.origin === 'null') {
      ;(async () => {
        //last fetched index handling
        mineLastFetchIndex = Number(await window.swarm.localStorage.getItem('mine_last_fetch_index'))
        otherLastFetchIndex = Number(await window.swarm.localStorage.getItem('other_last_fetch_index'))
      })()
    } else {
      //last fetched index handling
      mineLastFetchIndex = Number(window.localStorage.getItem('mine_last_fetch_index'))
      otherLastFetchIndex = Number(window.localStorage.getItem('other_last_fetch_index'))
    }
  }, [])

  useEffect(() => {
    const otherMessagesInFormat: MessageBoxProps[] = otherMessages.map(m => {
      return {
        text: m.message,
        date: new Date(m.timestamp),
        position: 'right',
      }
    })
    const myMessagesInFormat: MessageBoxProps[] = myMessages.map(m => {
      return {
        text: m.message,
        date: new Date(m.timestamp),
        position: 'left',
      }
    })
    const messageList: MessageBoxProps[] = [...myMessagesInFormat, ...otherMessagesInFormat].sort(
      (a, b) => a.date!.getTime() - b.date!.getTime(),
    )

    setListMessages(messageList)
  }, [myMessages, otherMessages])

  useEffect(() => {
    setOtherMessages([])
  }, [othersEthAddress])

  async function refreshOthersMessage() {
    if (!othersEthAddress || othersEthAddress.length === 0) {
      console.error('nincs keyed haver')

      return
    }

    if (!myEthAddress) {
      console.error('There is no available eth address')

      return
    }

    setLoadListMessages(true)
    const hashTopicAtBro = hashTopicForMessage(myEthAddress)
    const feedReaderBro = bee.makeFeedReader('sequence', hashTopicAtBro, othersEthAddress)
    try {
      const latestBro = await feedReaderBro.download()

      // fetch older messages
      // from the other guy
      let fetchCount = fetchIndexToInt(latestBro.feedIndex) - otherLastFetchIndex

      if (fetchCount > 3) fetchCount = 3
      otherLastFetchIndex = fetchIndexToInt(latestBro.feedIndex)
      await saveLocalStorage('other_last_fetch_index', String(otherLastFetchIndex))

      const otherOlderMessages: MessageFormat[] = []
      const socReader = bee.makeSOCReader(othersEthAddress)
      const identifiers = previousIdentifiers(hashTopicAtBro, fetchIndexToInt(latestBro.feedIndex), fetchCount)
      for (const identifier of identifiers) {
        const olderUpdatePayload = (await socReader.download(identifier)).payload()
        const olderMessageReferene = Utils.bytesToHex(olderUpdatePayload.slice(-32))
        const bytes = await bee.downloadData(olderMessageReferene)
        otherOlderMessages.push(decodeMessage(bytes))
      }
      //download latest message
      const bytes = await bee.downloadData(latestBro.reference)
      const othersLatestMessage = decodeMessage(bytes)
      setOtherMessages([...otherOlderMessages, othersLatestMessage])
    } catch (e) {
      console.log('No latest message from bro', e)
    }

    // from me
    if (myMessages.length === 0) {
      //latest mine
      const hashTopicAtMine = hashTopicForMessage(othersEthAddress)
      const feedReaderMine = bee.makeFeedReader('sequence', hashTopicAtMine, myEthAddress)
      try {
        const latesMine = await feedReaderMine.download()

        let fetchCount = fetchIndexToInt(latesMine.feedIndex) - mineLastFetchIndex

        if (fetchCount > 3) fetchCount = 3
        mineLastFetchIndex = fetchIndexToInt(latesMine.feedIndex)
        await saveLocalStorage('mine_last_fetch_index', String(mineLastFetchIndex))

        const otherOlderMessages: MessageFormat[] = []
        const socReader = bee.makeSOCReader(myEthAddress)
        const identifiers = previousIdentifiers(hashTopicAtMine, fetchIndexToInt(latesMine.feedIndex), fetchCount)
        for (const identifier of identifiers) {
          const olderUpdatePayload = (await socReader.download(identifier)).payload()
          const olderMessageReferene = Utils.bytesToHex(olderUpdatePayload.slice(-32))
          const bytes = await bee.downloadData(olderMessageReferene)
          otherOlderMessages.push(decodeMessage(bytes))
        }

        const bytes = await bee.downloadData(latesMine.reference)
        const myLatestMessage = decodeMessage(bytes)
        setMyMessages([...otherOlderMessages, myLatestMessage])
      } catch (e) {
        console.log('No message from me', e)
      }
    }

    setLoadListMessages(false)
  }

  return (
    <div className="read">
      <div>
        <h3>Messages</h3>
        <Row>
          <Col style={{ textAlign: 'left', fontWeight: 'bold' }}>You</Col>
          <Col style={{ textAlign: 'right', fontWeight: 'bold' }}>Bro</Col>
        </Row>
        <div style={{ padding: '12px 0' }}>
          {listMessages.map(listMessage => (
            <div
              key={`${listMessage.date}|${listMessage.position}`}
              style={{ textAlign: listMessage.position, margin: '12px 0' }}
            >
              <span
                className={listMessage.position === 'right' ? 'bg-primary' : 'bg-secondary'}
                style={{
                  borderRadius: 5,
                  padding: 5,
                  overflowWrap: 'break-word',
                }}
              >
                {listMessage.text}
              </span>
            </div>
          ))}
        </div>
        <div hidden={listMessages.length > 0}>There are no loaded messages yet. Smash the Refresh button.</div>
        <div style={{ minHeight: 42 }}>
          <Spinner animation="grow" hidden={!loadListMessages} />
        </div>
        <Button onClick={refreshOthersMessage} className="refreshButton" disabled={loadListMessages}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
