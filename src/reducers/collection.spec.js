import reducer from './collection'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(
        {"rows": [], "totalRows": 0, "visibleSongs": []}
      )
  })
})


