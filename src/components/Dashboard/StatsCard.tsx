import DashboardCard from './DashboardCard'
import Icon from '../common/Icon'
import { useMediaCount, useAlbumsCount, useArtistsCount } from '../../stores/livestore/hooks'

const StatsCard = () => {
  const songCount = useMediaCount()
  const albumCount = useAlbumsCount()
  const artistCount = useArtistsCount()

  return (
    <DashboardCard title="Your Library" icon="faChartBar">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{songCount}</p>
          <p className="text-sm opacity-70"><Icon icon="faMusic" className="mr-1" />songs</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{albumCount}</p>
          <p className="text-sm opacity-70"><Icon icon="faCompactDisc" className="mr-1" />albums</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{artistCount}</p>
          <p className="text-sm opacity-70"><Icon icon="faMicrophoneAlt" className="mr-1" />artists</p>
        </div>
      </div>
    </DashboardCard>
  )
}

export default StatsCard
