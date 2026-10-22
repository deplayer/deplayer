export const inSection = (location: { pathname: string }, section: string) => {
  const pattern = '^/' + section + '$'
  return location?.pathname.match(new RegExp(pattern)) ? true : false
}

