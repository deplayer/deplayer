import { ISettingsBuilder } from '../../interfaces/ISettingsBuilder'
import sections from './sections'

export default class SettingsBuilder implements ISettingsBuilder {
  getFormSchema() {
    const totalSections = Object.keys(sections).reduce((accumulator, sectionId: string) => {
      return [...accumulator, ...sections[sectionId].getFormSchema()]
    }, [])

    return (
      {
        fields: totalSections
      }
    )
  }
}
