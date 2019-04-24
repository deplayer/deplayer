import { ISettingsBuilder } from '../../interfaces/ISettingsBuilder'
import sections from './sections'
import providerBuilders from './providers'

export default class SettingsBuilder implements ISettingsBuilder {
  getFormSchema(providers: any = {}) {
    const totalFields = Object.keys(sections).reduce((accumulator, sectionId: string) => {
      if (sections[sectionId].isRepeatable) {
        return accumulator
      }

      return [...accumulator, ...sections[sectionId].getFormSchema()]
    }, [])

    const providerFields = Object.keys(providers).reduce((accumulator, providerId: string) => {
      const providerType = providerId.replace(/[0-9]/g, '')
      const providerNum = Object.keys(providers).indexOf(providerId) || 0

      if (!providerBuilders[providerType]) {
        return accumulator
      }

      accumulator[providerId] = providerBuilders[providerType].getFormSchema(providerNum)

      return accumulator
    }, {})

    return (
      {
        providers: providerFields,
        fields: totalFields
      }
    )
  }
}
