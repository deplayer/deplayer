import React from 'react'

import Button from '../common/Button'
import Modal from '../common/Modal'

const randomStringFromServer = "randomStringFromServer"

async function startRegister(username: string, displayName: string, id: string) {
  const publicKeyCredentialCreationOptions = {
    challenge: Uint8Array.from(randomStringFromServer, c => c.charCodeAt(0)),
    rp: {
        name: "Duo Security",
        id: "localhost",
    },
    user: {
      // FIXME
        id: Uint8Array.from(id, c => c.charCodeAt(0)),
        name: username,
        displayName: displayName,
    },
    pubKeyCredParams: [{alg: -7, type: "public-key"}],
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform",
    },
    timeout: 60000,
    attestation: "direct"
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  })
  console.log('credential', credential)
}

type TransportTypes = 'usb' | 'ble' | 'nfc'

const startAuth = async ({ transports }: { transports: TransportTypes[] }) => {
  const publicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(randomStringFromServer, c => c.charCodeAt(0)),
      allowCredentials: [{
          id: Uint8Array.from("UZSL85T9AFC", c => c.charCodeAt(0)),
          type: 'public-key',
          transports: transports,
      }],
      timeout: 60000,
  }

  const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
  });
}

export default function Auth ({ }: {  }) {
  const [username, setUsername] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')

  React.useEffect(() => {
    startRegister().then(() => {
      console.log('start auth')
    })
  }, []);


  return (
    <Modal title='Authentication' onClose={() => {}}>
      <div className='flex'>
        <div className='p-4'>
          <form className='flex flex-col'>
            <input className='px-4 py-2 my-2' type='text' placeholder='Username' onChange={setUsername}/>
            <input className='px-4 py-2 my-2' type='text' placeholder='Display name' onChange={setDisplayName}/>
            <Button inverted onClick={() => startRegister(username, displayName)}>Register with your passkey</Button>
          </form>
        </div>
        <div className='p-4 flex flex-col items-center justify-center'>
          <Button inverted onClick={() => startAuth({transports: ['usb', 'ble', 'nfc']})}>Authenticate!</Button>
        </div>
      </div>
    </Modal>
  )
}
