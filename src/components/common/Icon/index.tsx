import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCheckSquare,
  faSquare,
  faBahai,
  faPauseCircle,
  faStepForward,
  faStepBackward,
  faMusic,
  faSpinner,
  faCaretRight,
  faCogs,
  faGlobe,
  faLifeRing,
  faPlug,
  faFileAudio,
  faBookmark,
  faDatabase,
  faFilm,
  faScroll,
  faEllipsisV,
  faChevronDown,
  faChevronRight,
  faRandom,
  faRedo,
  faCompactDisc,
  faStopwatch,
  faMicrophoneAlt,
  faExpand,
  faPlusCircle,
  faMinusCircle,
  faArrowLeft,
  faTimes,
  faArrowRight,
  faArrowCircleLeft,
  faArrowCircleRight,
  faFolderPlus,
  faEyeSlash,
  faPlay,
  faTrash,
  faSave,
  faSearch,
  faBars,
  faPlayCircle
} from "@fortawesome/free-solid-svg-icons"
import { faGitlab, faDeezer } from "@fortawesome/free-brands-svg-icons"

import React from 'react'

const icons = {
  faMusic,
  faCheckSquare,
  faSquare,
  faPauseCircle,
  faStepBackward,
  faStepForward,
  faSpinner,
  faCaretRight,
  faGlobe,
  faCogs,
  faGitlab,
  faLifeRing,
  faPlug,
  faScroll,
  faFileAudio,
  faDatabase,
  faBookmark,
  faFilm,
  faEllipsisV,
  faChevronDown,
  faChevronRight,
  faRandom,
  faRedo,
  faCompactDisc,
  faStopwatch,
  faMicrophoneAlt,
  faExpand,
  faPlusCircle,
  faMinusCircle,
  faEyeSlash,
  faPlay,
  faTimes,
  faTrash,
  faSave,
  faArrowRight,
  faArrowLeft,
  faArrowCircleRight,
  faArrowCircleLeft,
  faPlayCircle,
  faSearch,
  faBars,
  faFolderPlus,
  faBahai,
  faDeezer
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
