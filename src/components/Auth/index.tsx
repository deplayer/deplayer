import { Formik, Form, Field } from 'formik'
import { set, get } from 'idb-keyval'

import Button from '../common/Button'
import Modal from '../common/Modal'
import { Dispatch } from 'redux'

const REGISTER_TIMEOUT = 600

const randomStringFromServer = "randomStringFromServer"
const host = process.env.NODE_ENV === 'development' ? 'localhost' : window.location.origin


async function startRegister(username: string, displayName: string, dispatch: Function) {
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
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
  }

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions
  }) as PublicKeyCredential
  console.log('credential', credential)

  localStorage.setItem('credential', JSON.stringify(credential))
  await set('credential', credential.rawId)

  dispatch({ type: 'SET_CREDENTIAL', payload: credential })
}

const toUTF8String = (buf: Uint8Array) => {
  return String.fromCharCode.apply(null, Array.from(buf))
}

async function getCredential() {
  return await get('credential') as BufferSource
}

const startAuth = async (dispatch: Dispatch) => {
  const id = await getCredential()

  if (!id) {
    console.log('No credential found')
    return
  }

  console.log('Credential id: ', id)

  const publicKeyCredentialRequestOptions = {
    challenge: Uint8Array.from(randomStringFromServer, c => c.charCodeAt(0)),
    allowCredentials: [{ type: 'public-key', id: id }] as PublicKeyCredentialDescriptor[],
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
  }

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions
  }) as PublicKeyCredential // Review this as

  console.log('assertion', assertion)
  if (!assertion) {
    return
  }

  const authClientDataRaw = new Uint8Array(assertion.response.clientDataJSON);
  const authClientData = JSON.parse(toUTF8String(authClientDataRaw));

  set('credential', assertion.rawId)

  console.log('authClientData', authClientData)

  dispatch({ type: 'SET_CREDENTIAL', payload: assertion })
}

interface Props {
  onClose: Function,
  dispatch: Dispatch
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
                <Button type='submit' disabled={isSubmitting}>Register with your passkey</Button>
                <p className='py-2 text-sm'>This passkey will be only stored in this device</p>
              </Form>
            )}
          </Formik>
        </div>
        <div className='p-4 flex flex-col items-center justify-center'>
          <Button inverted onClick={() => startAuth(dispatch)}>Authenticate!</Button>
        </div>
      </div>
    </Modal>
  )
}
