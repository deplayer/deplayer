import sections from "./sections";
import providerBuilders from "./providers";

export default class SettingsBuilder {
  getFormSchema(providers: any = {}) {
    const totalFields = Object.keys(sections).reduce(
      (accumulator: any, sectionId: string) => {
        if (sections[sectionId].isRepeatable) {
          return accumulator;
        }

        return [...accumulator, ...sections[sectionId].getFormSchema()];
      },
      []
    );

    const providerFields = Object.keys(providers).reduce(
      (accumulator: any, providerId: string) => {
        const providerType = providerId.replace(/[0-9]/g, "");

        if (!providerBuilders[providerType]) {
          return accumulator;
        }

        // Extract the numeric suffix if it exists
        const numMatch = providerId.match(/\d+$/);
        const providerNum = numMatch ? numMatch[0] : "";

        accumulator[providerId] = providerBuilders[providerType].getFormSchema(
          providerNum
        );

        return accumulator;
      },
      {}
    );

    return {
      providers: providerFields,
      fields: totalFields,
    };
  }
}
