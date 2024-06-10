import Modal from '../common/Modal'
import Header from '../common/Header'

type Props = {
  onClose: () => void
  lyrics: string
}

const Lyrics = (props: Props) => {
  return (
    <Modal
      onClose={() => {
        props.onClose()
      }}
    >
      <Header>Lyrics</Header>
      <div className='p-4 my-6'>
        <pre className='overflow-y-auto'>
          {props.lyrics}
        </pre>
      </div>
    </Modal>
  )
}

export default Lyrics
