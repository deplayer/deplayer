import SpectrumSVG from './SpectrumSVG'

const Footer = () => {
  return (
    <div className='flex flex-col items-center mt-12'>
      <h4 className="text-xl text-center pt-4 text-primary px-4">
        <><span className='text-primary'>d</span><span className='text-base-content'>eplayer</span></>
      </h4>
      <p className='text-base relative pb-12'>Your music, your way</p>
      <div className="bottom-0">
        <SpectrumSVG />
      </div>
    </div>
  )
}

export default Footer 