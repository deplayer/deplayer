import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faFilter,
  faDownload,
  faCheckSquare,
  faSquare,
  faBahai,
  faPauseCircle,
  faStepForward,
  faStepBackward,
  faMusic,
  faMoon,
  faSpinner,
  faCaretRight,
  faCogs,
  faGlobe,
  faLifeRing,
  faPlug,
  faFileAudio,
  faHardDrive,
  faBookmark,
  faSun,
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

const icons = {
  faFilter,
  faDownload,
  faMusic,
  faCheckSquare,
  faSquare,
  faPauseCircle,
  faStepBackward,
  faStepForward,
  faMoon,
  faSpinner,
  faCaretRight,
  faGlobe,
  faCogs,
  faGitlab,
  faLifeRing,
  faPlug,
  faScroll,
  faFileAudio,
  faHardDrive,
  faDatabase,
  faBookmark,
  faSun,
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
  onClick?: () => void
}

const Icon = (props: Props) => {
  return (
    <FontAwesomeIcon
      onClick={props.onClick}
      className={props.className || ''}
      icon={icons[props.icon]}
      fixedWidth={props.fixedWidth}
    />
  )
}

export default Icon
