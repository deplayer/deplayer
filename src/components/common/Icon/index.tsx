import React from 'react'

import {
  faCompactDisc,
  faStopwatch,
  faMicrophoneAlt
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const icons = {
  faCompactDisc: faCompactDisc,
  faStopwatch: faStopwatch,
  faMicrophoneAlt: faMicrophoneAlt
}

type Props = {
  icon: keyof typeof icons,
  className?: string
}

const Icon = (props: Props) => {
  return (
    <FontAwesomeIcon className={props.className} icon={icons[props.icon]} />
  )
}

export default Icon
