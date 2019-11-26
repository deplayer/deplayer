import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCompactDisc,
  faStopwatch,
  faMicrophoneAlt,
  faExpand,
  faPlusCircle,
  faMinusCircle,
  faFolderPlus,
  faEyeSlash,
  faPlay,
  faPlayCircle
} from "@fortawesome/free-solid-svg-icons"
import React from 'react'

const icons = {
  faCompactDisc: faCompactDisc,
  faStopwatch: faStopwatch,
  faMicrophoneAlt: faMicrophoneAlt,
  faExpand: faExpand,
  faPlusCircle: faPlusCircle,
  faMinusCircle: faMinusCircle,
  faEyeSlash: faEyeSlash,
  faPlay: faPlay,
  faPlayCircle: faPlayCircle,
  faFolderPlus: faFolderPlus
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
