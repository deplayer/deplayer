export const inSection = (location: { pathname: String }, section: string) => {
  const pattern = '^\/' + section + '$'
  return location?.pathname.match(new RegExp(pattern)) ? true : false
}

