export const inSection = (location, section: string) => {
  const pattern = '^/' + section + '$'
  return location.pathname.match(new RegExp(pattern)) ? true : false
}

