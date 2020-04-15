import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faScroll,
  faEllipsisV,
  faCompactDisc,
  faStopwatch,
  faMicrophoneAlt,
  faExpand,
  faPlusCircle,
  faMinusCircle,
  faArrowLeft,
  faArrowRight,
  faArrowCircleLeft,
  faArrowCircleRight,
  faFolderPlus,
  faEyeSlash,
  faPlay,
  faPlayCircle
} from "@fortawesome/free-solid-svg-icons"
import React from 'react'

const icons = {
  faScroll: faScroll,
  faEllipsisV: faEllipsisV,
  faCompactDisc: faCompactDisc,
  faStopwatch: faStopwatch,
  faMicrophoneAlt: faMicrophoneAlt,
  faExpand: faExpand,
  faPlusCircle: faPlusCircle,
  faMinusCircle: faMinusCircle,
  faEyeSlash: faEyeSlash,
  faPlay: faPlay,
  faArrowRight: faArrowRight,
  faArrowLeft: faArrowLeft,
  faArrowCircleRight: faArrowCircleRight,
  faArrowCircleLeft: faArrowCircleLeft,
  faPlayCircle: faPlayCircle,
  faFolderPlus: faFolderPlus
}

type Props = {
  icon: keyof typeof icons,
  className?: string,
  fixedWidth?: boolean
}

const Icon = (props: Props) => {
  return (
    <FontAwesomeIcon
      className={props.className}
      icon={icons[props.icon]}
      fixedWidth={props.fixedWidth}
    />
  )
}

export default Icon
