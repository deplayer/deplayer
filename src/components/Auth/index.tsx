import { Formik, Form, Field } from 'formik'
import { set, get } from 'idb-keyval'
import { toast } from 'react-toastify'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import Button from '../common/Button'
import Modal from '../common/Modal'
import { Dispatch } from 'redux'
import { storeSyncSettings, getSyncFormSchema } from '../../services/settings/syncSettings'
import { reconnect } from '../../services/database/PgliteDatabase'

const REGISTER_TIMEOUT = 600

const randomStringFromServer = "randomStringFromServer"
const host = process.env.NODE_ENV === 'development' ? 'localhost' : window.location.host


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

interface AuthFormValues {
  username: string
  displayName: string
  serverUrl?: string
  enabled?: boolean
}

interface Props {
  onClose: Function,
  dispatch: Dispatch,
  isOpen: boolean
}

const formControlClass = classNames(
  'form-control',
  'w-full',
  'mb-6'
)

const inputClass = classNames(
  'input',
  'input-bordered',
  'w-full',
  'bg-base-100'
)

export default function Auth({ onClose, dispatch, isOpen }: Props) {
  const syncSchema = getSyncFormSchema()
  const initialSyncValues = syncSchema.fields.reduce((acc: any, field: any) => {
    if (field.name) {
      acc[field.name] = field.value
    }
    return acc
  }, {})

  const handleSubmit = async (values: AuthFormValues) => {
    try {
      // Register with passkey
      await startRegister(values.username, values.displayName, dispatch)

      // Store sync settings if provided
      if (values.serverUrl) {
        await storeSyncSettings({
          serverUrl: values.serverUrl,
          enabled: true
        })
        await reconnect()
        toast.success('Sync settings saved')
      }

      onClose()
    } catch (error) {
      console.error('Error during registration:', error)
      toast.error('Error during registration')
    }
  }

  return (
    <Modal title='Authentication' onClose={() => onClose()} isOpen={isOpen}>
      <div className='p-4'>
        <Formik
          initialValues={{
            username: '',
            displayName: '',
            ...initialSyncValues
          }}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className='flex flex-col'>
              <div className={formControlClass}>
                <label className='label'>
                  <span className='label-text'><Translate value="labels.username" /></span>
                </label>
                <Field
                  className={inputClass}
                  type='text'
                  name='username'
                  placeholder='Username'
                />
              </div>

              <div className={formControlClass}>
                <label className='label'>
                  <span className='label-text'><Translate value="labels.displayName" /></span>
                </label>
                <Field
                  className={inputClass}
                  type='text'
                  name='displayName'
                  placeholder='Display name'
                />
              </div>

              <div className={formControlClass}>
                <label className='label'>
                  <span className='label-text'><Translate value="labels.syncServerUrl" /></span>
                </label>
                <Field
                  className={inputClass}
                  type='text'
                  name='serverUrl'
                  placeholder='https://your-sync-server.com'
                />
              </div>

              <div className="alert alert-info mt-4 mb-4">
                <p>
                  <Translate value="labels.syncServerInstructions" />
                  {' '}
                  <a 
                    href="https://gitlab.com/deplayer/deplayer/-/blob/master/README.md#sync-server-setup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link link-primary-content"
                  >
                    <Translate value="labels.readDocs" />
                  </a>
                </p>
              </div>

              <Button type='submit' disabled={isSubmitting}>
                <Translate value="buttons.register" />
              </Button>

              <div className='divider'>OR</div>

              <Button inverted onClick={() => startAuth(dispatch)}>
                <Translate value="buttons.authenticate" />
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  )
}
