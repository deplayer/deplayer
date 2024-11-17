import { ISettingsProvider } from "./ISettingsProvider";

export default class Jellyfin implements ISettingsProvider {
  isRepeatable: true;

  constructor() {
    this.isRepeatable = true;
  }

  getFormSchema(index: string = "") {
    return {
      fields: [
        { title: "labels.jellyfin", type: "title" },
        {
          title: "labels.enabled",
          name: `providers.jellyfin${index}.enabled`,
          type: "checkbox",
        },
        {
          title: "labels.jellyfin.baseUrl",
          name: `providers.jellyfin${index}.baseUrl`,
          type: "url",
        },
        {
          title: "labels.jellyfin.apiKey",
          name: `providers.jellyfin${index}.apiKey`,
          type: "password",
        },
        {
          title: "labels.jellyfin.username",
          name: `providers.jellyfin${index}.username`,
          type: "text",
        },
        {
          title: "labels.jellyfin.password",
          name: `providers.jellyfin${index}.password`,
          type: "password",
        },
      ],
    };
  }
}
