import './index.css'
import CommandPalette from 'react-command-palette'

const commands = [{
  name: "Add new media",
  command() { }
}, {
  name: "Toggle visuals",
  command() { }
},
{
  name: "Toggle spectrum",
  command() { }
}
]

function MyCommandPalette() {
  const trigger = "command bar"

  return (
    <div className='absolute mt-5'>
      <CommandPalette commands={commands} trigger={trigger} />
    </div>
  )
}

export default MyCommandPalette
