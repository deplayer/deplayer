import { Formik, Form, Field } from 'formik'

import Button from '../common/Button'
import Modal from '../common/Modal'

const REGISTER_TIMEOUT = 600

const randomStringFromServer = "randomStringFromServer"
const host = process.env.NODE_ENV === 'development' ? 'localhost' : window.location.origin

async function startRegister(username: string, displayName: string, dispatch: Function) {
  const publicKeyCredentialCreationOptions = {
    credentialType: "publicKey",
    challenge: Uint8Array.from(randomStringFromServer, c => c.charCodeAt(0)),
    rp: {
      name: "deplayer",
      id: host,
    },
    user: {
      id: Uint8Array.from(username, c => c.charCodeAt(0)),
      name: username,
      displayName: displayName,
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform", // Review this
    },
    timeout: REGISTER_TIMEOUT,
    // attestation: "direct"
    attestation: "none"
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  })
  console.log('credential', credential)

  localStorage.setItem('credential', JSON.stringify(credential))

  dispatch({ type: 'SET_CREDENTIAL', payload: credential })
}

type TransportTypes = 'usb' | 'ble' | 'nfc'

const toUTF8String = (buf: Uint8Array) => {
  return String.fromCharCode.apply(null, Array.from(buf))
}

const startAuth = async ({ transports, id }: { transports: TransportTypes[], id: string }) => {
  const publicKeyCredentialRequestOptions = {
    challenge: Uint8Array.from(randomStringFromServer, c => c.charCodeAt(0))
  }

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions
  })

  console.log('assertion', assertion)
  if (!assertion) {
    return
  }

  const authClientDataRaw = new Uint8Array(assertion.response.clientDataJSON);
  const authClientData = JSON.parse(toUTF8String(authClientDataRaw));

  console.log('authClientData', authClientData)
}

interface Props {
  onClose: Function,
  dispatch: Function
}

export default function Auth({ onClose, dispatch }: Props) {
  return (
    <Modal title='Authentication' onClose={() => onClose()}>
      <div className='flex'>
        <div className='p-4'>
          <Formik
            initialValues={{ username: '', displayName: '' }}
            onSubmit={(values) => {
              startRegister(values.username, values.displayName, dispatch)
            }}
          >
            {({ isSubmitting }) => (
              <Form className='flex flex-col'>
                <Field className='px-4 py-2 my-2' type='text' name='username' placeholder='Username' />
                <Field className='px-4 py-2 my-2' type='text' name='displayName' placeholder='Display name' />
                <button type='submit' disabled={isSubmitting}>Register with your passkey</button>
              </Form>
            )}
          </Formik>
        </div>
        <div className='p-4 flex flex-col items-center justify-center'>
          <Button inverted onClick={() => startAuth({ transports: ['usb', 'ble', 'nfc'], id: 'gtrias' })}>Authenticate!</Button>
        </div>
      </div>
    </Modal>
  )
}
