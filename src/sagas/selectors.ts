// Extract settings from state
export const getSettings = (state: any) => {
  return state ? state.settings.settings : {providers: {}}
}
