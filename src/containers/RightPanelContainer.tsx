import Sidebar from 'react-sidebar'
import Social from '../pages/Social'
import { useUIStore } from '../stores/uiStore'

const SidebarContents = () => {
  return <div className='w-full h-full'>
    <Social />
  </div>
}

const RightPanelContainer = () => {
  const rightPanelToggled = useUIStore((s) => s.rightPanelToggled)
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel)

  return (
    <Sidebar
      sidebar={<SidebarContents />}
      open={rightPanelToggled}
      pullRight={true}
      onSetOpen={(open: boolean) => toggleRightPanel(open)}
      sidebarId='right-sidebar'
      sidebarClassName='w-64 bg-base-200/70 backdrop-blur fixed'
      overlayId='right-sidebar-overlay'
      overlayClassName='fixed inset-0'
      contentId='right-sidebar-content'
      styles={{
        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: '40' },
        sidebar: { position: 'fixed', zIndex: '50' },
        content: { position: 'relative' }
      }}
    >
      <div id='right-sidebar-content' />
    </Sidebar>
  )
}

export default RightPanelContainer
