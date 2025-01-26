import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import VolumeControl from './VolumeControl'

const mockStore = configureStore([])

describe('VolumeControl', () => {
  it('renders without crashing', () => {
    const store = mockStore({})
    const onChange = vi.fn()
    
    render(
      <Provider store={store}>
        <VolumeControl volume={50} onChange={onChange} />
      </Provider>
    )
    
    expect(screen.getByRole('slider')).toBeTruthy()
  })
})
