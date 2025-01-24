import { Translate } from 'react-redux-i18n'
import { useSelector } from 'react-redux'
import MediaSlider from '../MediaSlider'
import { State as RootState } from '../../reducers'

const RecentAlbums = () => {
  const recentAlbums = useSelector((state: RootState) => state.collection.recentAlbums || [])

  if (!recentAlbums.length) {
    return null
  }

  return (
    <MediaSlider
      loading={false}
      title={<Translate value="dashboard.recentlyAdded" />}
      mediaItems={recentAlbums}
    />
  )
}

export default RecentAlbums 