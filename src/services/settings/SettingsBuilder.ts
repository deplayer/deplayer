import { ISettingsBuilder } from '../../interfaces/ISettingsBuilder'
import sections from './sections'

export default class SettingsBuilder implements ISettingsBuilder {
  getFormSchema(providers: Array<any> = []) {
    const totalFields = Object.keys(sections).reduce((accumulator, sectionId: string) => {
      console.log(sections[sectionId])
      if (sections[sectionId].isRepeatable) {
        return accumulator
      }

      return [...accumulator, ...sections[sectionId].getFormSchema()]
    }, [])

    console.log('totalFields: ', totalFields)

    const providerFields = Object.keys(sections).reduce((accumulator, sectionId: string) => {
      if (!sections[sectionId].isRepeatable) {
        return accumulator
      }

      return [...accumulator, ...sections[sectionId].getFormSchema()]
    }, [])

    return (
      {
        providerFields,
        fields: totalFields
      }
    )
  }
}
