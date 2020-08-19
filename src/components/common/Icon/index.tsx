import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
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
import { faGitlab } from "@fortawesome/free-brands-svg-icons"

import React from 'react'

const icons = {
  faMusic: faMusic,
  faPauseCircle: faPauseCircle,
  faStepBackward: faStepBackward,
  faStepForward: faStepForward,
  faSpinner: faSpinner,
  faCaretRight: faCaretRight,
  faGlobe: faGlobe,
  faCogs: faCogs,
  faGitlab: faGitlab,
  faLifeRing: faLifeRing,
  faPlug: faPlug,
  faScroll: faScroll,
  faFileAudio: faFileAudio,
  faDatabase: faDatabase,
  faBookmark: faBookmark,
  faFilm: faFilm,
  faEllipsisV: faEllipsisV,
  faChevronDown: faChevronDown,
  faChevronRight: faChevronRight,
  faRandom: faRandom,
  faRedo: faRedo,
  faCompactDisc: faCompactDisc,
  faStopwatch: faStopwatch,
  faMicrophoneAlt: faMicrophoneAlt,
  faExpand: faExpand,
  faPlusCircle: faPlusCircle,
  faMinusCircle: faMinusCircle,
  faEyeSlash: faEyeSlash,
  faPlay: faPlay,
  faTimes: faTimes,
  faTrash: faTrash,
  faSave: faSave,
  faArrowRight: faArrowRight,
  faArrowLeft: faArrowLeft,
  faArrowCircleRight: faArrowCircleRight,
  faArrowCircleLeft: faArrowCircleLeft,
  faPlayCircle: faPlayCircle,
  faSearch: faSearch,
  faBars: faBars,
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
